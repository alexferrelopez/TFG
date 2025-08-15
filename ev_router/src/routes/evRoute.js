import express from 'express'
import dijkstra from 'dijkstrajs'
import { buildChargerGraph } from '../solver.js'
import { stitchPath } from '../stitch.js'
import { orsRoute } from '../ors.js'
import { pruneAlongCorridor } from '../prune.js'
import { validateEvRouteRequest } from '../validation.js'
import { chargerData, PERFORMANCE_CONFIG } from '../index.js'

const router = express.Router()

// Route for EV routing
router.post('/ev-route', async (req, res) => {
  const startTime = performance.now()
  const timings = {}

  // Helper functions for consistent error handling
  const cleanupAndRespond = (statusCode, data) => {
    clearTimeout(timeout)
    if (!res.headersSent) {
      res.status(statusCode).json(data)
    }
  }

  const createErrorResponse = (type, message, details = null) => ({
    error: {
      type,
      message,
      details,
      timestamp: new Date().toISOString()
    }
  })

  // Set request timeout
  const timeout = setTimeout(() => {
    cleanupAndRespond(504, createErrorResponse('timeout', 'Request timeout - route calculation taking too long'))
  }, PERFORMANCE_CONFIG.requestTimeoutMs)

  try {
    // Clear timeout on completion
    const clearTimeoutAndSend = (data) => {
      clearTimeout(timeout)
      if (!res.headersSent) {
        res.json(data)
      }
    }

    // Validate request body
    const validationErrors = validateEvRouteRequest(req.body)
    if (validationErrors.length > 0) {
      console.error('Validation Error:', { 
        validationErrors, 
        body: req.body,
        timestamp: new Date().toISOString()
      })
      return cleanupAndRespond(400, createErrorResponse('validation', 'Invalid request parameters', validationErrors))
    }

    const {
      origin,
      destination,
      evRangeKm,
      evMaxPowerKw,
      connectors = ['iec62196T2COMBO'],
      minPowerKw,
    } = req.body

    // Use server-controlled performance parameters
    const { bufferKm, segmentKm, maxOrsCandidates } = PERFORMANCE_CONFIG

    console.log('EV Route Request:', {
      origin,
      destination,
      evRangeKm,
      evMaxPowerKw,
      connectors,
      minPowerKw,
      bufferKm,
      segmentKm,
      maxOrsCandidates
    })

    // 1) Baseline route (for corridor)
    const step1Start = performance.now()
    const baseline = await orsRoute([origin, destination])
    const baseLine = baseline.features?.[0]?.geometry
    if (!baseLine) throw new Error('No baseline route geometry from ORS')
    timings.step1_baseline_route = performance.now() - step1Start

    // 2) Prune candidates along corridor
    const step2Start = performance.now()
    const pruneResult = pruneAlongCorridor({
      features: chargerData.chargers,
      baseLine,
      connectors,
      minPowerKw,
      bufferKm,
      segmentKm,
      maxOrsCandidates,
      evMaxPowerKw
    })
    const candidates = pruneResult.features || pruneResult
    timings.step2_prune_candidates = performance.now() - step2Start

    // 3) Build EV-feasible graph from O + candidates + D
    const step3Start = performance.now()
    const { nodes, graph } = await buildChargerGraph({
      origin, destination, chargers: candidates, evRangeKm, evMaxPowerKw
    })
    timings.step3_build_graph = performance.now() - step3Start

    // 4) Find recommended (fastest) path
    const step4Start = performance.now()
    let recommendedKeys
    try {
      recommendedKeys = dijkstra.find_path(graph, 'O', 'D')
    } catch {
      recommendedKeys = null
    }
    timings.step4_dijkstra = performance.now() - step4Start

    // If no feasible path, report helpful info
    if (!recommendedKeys) {
      console.log('No feasible route found:', {
        origin,
        destination,
        evRangeKm,
        evMaxPowerKw,
        minPowerKw,
        candidatesFound: candidates.length,
        timestamp: new Date().toISOString()
      })
      return cleanupAndRespond(422, createErrorResponse(
        'no_route',
        'No feasible route within range and filters',
        { hint: 'Try increasing evRangeKm, lowering minPowerKw, or adjusting evMaxPowerKw' }
      ))
    }

    // 5) Stitch path legs
    const step5Start = performance.now()
    const byKey = Object.fromEntries(nodes.map(n => [n.key, n]))
    const recommendedNodes = recommendedKeys.map(k => byKey[k])
    const recommendedPath = await stitchPath(recommendedNodes, evMaxPowerKw)
    timings.step5_stitch_path = performance.now() - step5Start

    // Calculate total time
    timings.total_time = performance.now() - startTime

    // Build result
    const result = {
      recommended_route: recommendedPath
    }

    // Log performance summary to console
    console.log('=== EV Route Performance ===')
    console.log(`Total: ${timings.total_time.toFixed(2)}ms`)
    console.log(`  1. Baseline route: ${timings.step1_baseline_route.toFixed(2)}ms`)
    console.log(`  2. Prune candidates: ${timings.step2_prune_candidates.toFixed(2)}ms`)
    console.log(`  3. Build graph: ${timings.step3_build_graph.toFixed(2)}ms`)
    console.log(`  4. Dijkstra: ${timings.step4_dijkstra.toFixed(2)}ms`)
    console.log(`  5. Stitch path: ${timings.step5_stitch_path.toFixed(2)}ms`)
    console.log(`Candidates found: ${candidates.length}`)

    // Log trip summary
    if (recommendedPath?.summary) {
      console.log('=== Trip Summary ===')
      console.log(`Trip time: ${recommendedPath.summary.totalTripTimeFormatted} (${recommendedPath.summary.totalDurationFormatted} driving + ${recommendedPath.summary.totalChargingTimeFormatted} charging)`)
      console.log(`Distance: ${recommendedPath.summary.totalDistanceFormatted}`)
      console.log(`Charging stops: ${recommendedPath.summary.stops}`)
    }

    clearTimeoutAndSend(result)
  } catch (err) {
    // Log full error details server-side only
    console.error('EV Route Error:', {
      message: err.message,
      stack: err.stack,
      request: { 
        origin: req.body.origin, 
        destination: req.body.destination, 
        evRangeKm: req.body.evRangeKm, 
        evMaxPowerKw: req.body.evMaxPowerKw, 
        minPowerKw: req.body.minPowerKw 
      },
      timestamp: new Date().toISOString()
    })

    // Determine safe error message to expose to client (no stack trace or internal details)
    let safeMessage = 'Internal server error'
    let errorType = 'server'

    if (err.message?.includes('ORS') || err.message?.includes('routing')) {
      safeMessage = 'Routing service temporarily unavailable'
      errorType = 'service'
    } else if (err.message?.includes('timeout')) {
      safeMessage = 'Request processing timeout'
      errorType = 'timeout'
    } else if (err.message?.includes('No baseline route')) {
      safeMessage = 'Unable to find route between origin and destination'
      errorType = 'routing'
    }

    // Only send safe, sanitized error response to client
    cleanupAndRespond(500, createErrorResponse(errorType, safeMessage))
  }
})

export default router
