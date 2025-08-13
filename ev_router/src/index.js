import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

import dijkstra from 'dijkstrajs'
import { buildChargerGraph } from './solver.js'
import { stitchPath } from './stitch.js'
import { orsRoute } from './ors.js'
import { pruneAlongCorridor, divideChargersByPower } from './prune.js'
import { validateEvRouteRequest } from './validation.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const port = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(morgan('dev'))
app.use(express.json({ limit: '1mb' }))

// Load charger data once at startup
const chargersPath = path.join(__dirname, '../data/chargers.geojson')
const chargersRaw = JSON.parse(fs.readFileSync(chargersPath, 'utf8'))
const chargers = chargersRaw.features || []

// Divide chargers by power level on startup
const { highPower, lowPower } = divideChargersByPower(chargers, 50)
console.log(`Loaded ${chargers.length} chargers: ${highPower.length} high-power (≥50kW), ${lowPower.length} low-power (<50kW)`)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
})

// Test route
app.get('/', (req, res) => {
  res.json({
    ok: true,
    chargers: chargers.length,
    highPower: highPower.length,
    lowPower: lowPower.length
  })
})

// Server-controlled performance parameters (not exposed to users)
const PERFORMANCE_CONFIG = {
  bufferKm: Number(process.env.BUFFER_KM || 25),
  segmentKm: Number(process.env.SEGMENT_KM || 75),
  topPerSegment: 3,
  requestTimeoutMs: 30000                             // 30 second timeout
}

// Route for EV routing
app.post('/ev-route', async (req, res) => {
  const startTime = performance.now()
  const timings = {}

  // Set request timeout
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({ error: 'Request timeout - route calculation taking too long' })
    }
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
      clearTimeout(timeout)
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      })
    }

    const {
      origin,
      destination,
      evRangeKm = Number(process.env.RANGE_KM || 250),
      evMaxPowerKw = Number(process.env.EV_MAX_POWER_KW || 150),
      connectors = ['iec62196T2COMBO'],
      minPowerKw = Number(process.env.MIN_POWER_KW || 100),
    } = req.body

    // Use server-controlled performance parameters
    const { bufferKm, segmentKm, topPerSegment } = PERFORMANCE_CONFIG

    console.log('EV Route Request:', {
      origin,
      destination,
      evRangeKm,
      evMaxPowerKw,
      connectors,
      minPowerKw,
      bufferKm,
      segmentKm,
      topPerSegment
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
      features: highPower,
      baseLine,
      connectors,
      minPowerKw,
      bufferKm,
      segmentKm,
      topPerSegment,
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
      const errorResponse = {
        error: 'No feasible route within range and filters',
        hint: 'Try increasing evRangeKm, lowering minPowerKw, or adjusting evMaxPowerKw'
      }
      clearTimeout(timeout)
      return res.status(422).json(errorResponse)
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
      baseline_route: baseline,
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
    clearTimeout(timeout)
    console.error('EV Route Error:', {
      message: err.message,
      stack: err.stack,
      request: { origin, destination, evRangeKm, evMaxPowerKw, minPowerKw },
      timestamp: new Date().toISOString()
    })
    if (!res.headersSent) {
      res.status(500).json({
        error: err.message || String(err),
        timestamp: new Date().toISOString()
      })
    }
  }
})


app.listen(port, () => {
  console.log(`EV Router API running at http://localhost:${port}`)
})
