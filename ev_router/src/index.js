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

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const port = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

// Load charger data once at startup
const chargersPath = path.join(__dirname, '../data/chargers.geojson')
const chargersRaw = JSON.parse(fs.readFileSync(chargersPath, 'utf8'))
const chargers = chargersRaw.features || []

// Divide chargers by power level on startup
const { highPower, lowPower } = divideChargersByPower(chargers, 50)
console.log(`Loaded ${chargers.length} chargers: ${highPower.length} high-power (≥50kW), ${lowPower.length} low-power (<50kW)`)

// Test route
app.get('/', (req, res) => {
  res.json({
    ok: true,
    chargers: chargers.length,
    highPower: highPower.length,
    lowPower: lowPower.length
  })
})

// Route for EV routing
app.post('/ev-route', async (req, res) => {
  const startTime = performance.now()
  const timings = {}

  try {
    const {
      origin,
      destination,
      evRangeKm = Number(process.env.RANGE_KM || 250),
      evMaxPowerKw = Number(process.env.EV_MAX_POWER_KW || 150),
      connectors = ['iec62196T2COMBO'],
      minPowerKw = Number(process.env.MIN_POWER_KW || 100),
      bufferKm = Number(process.env.BUFFER_KM || 25),
      segmentKm = Number(process.env.SEGMENT_KM || 75),
      topPerSegment = 3,
    } = req.body

    console.log('EV Route Request:', {
      origin,
      destination,
      evRangeKm,
      evMaxPowerKw,
      connectors,
      minPowerKw,
      bufferKm,
      segmentKm,
      topPerSegment,
    })

    if (!Array.isArray(origin) || !Array.isArray(destination)) {
      return res.status(400).json({ error: 'origin and destination must be [lon,lat]' })
    }

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
      evMaxPowerKw,
      includePerformance: true
    })
    const candidates = pruneResult.features
    const prunePerformance = pruneResult.performance
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
      return res.status(422).json({
        error: 'No feasible route within range and filters',
        diagnostics: {
          candidates_considered: candidates.length,
          hint: 'Try increasing range, lowering minPowerKw, widening bufferKm, or adjusting evMaxPowerKw'
        }
      })
    }

    // 5) Stitch path legs
    const step5Start = performance.now()
    const byKey = Object.fromEntries(nodes.map(n => [n.key, n]))
    const recommendedNodes = recommendedKeys.map(k => byKey[k])
    const recommendedPath = await stitchPath(recommendedNodes)

    timings.step5_stitch_path = performance.now() - step5Start

    // Calculate total time
    timings.total_time = performance.now() - startTime

    // Build result
    const result = {
      baseline: baseline, // keep baseline for debugging/overlay
      recommended: recommendedPath,
      summary: {
        candidates: candidates.length,
        recommended: recommendedPath?.summary || null
      },
      performance: {
        timings_ms: timings,
        timings_formatted: {
          step1_baseline_route: `${timings.step1_baseline_route.toFixed(2)}ms`,
          step2_prune_candidates: `${timings.step2_prune_candidates.toFixed(2)}ms`,
          step3_build_graph: `${timings.step3_build_graph.toFixed(2)}ms`,
          step4_dijkstra: `${timings.step4_dijkstra.toFixed(2)}ms`,
          step5_stitch_path: `${timings.step5_stitch_path.toFixed(2)}ms`,
          total_time: `${timings.total_time.toFixed(2)}ms`
        },
        prune_performance: prunePerformance
      }
    }

    // Log performance summary to console
    console.log('=== EV Route Performance ===')
    console.log(`Total: ${timings.total_time.toFixed(2)}ms`)
    console.log(`  1. Baseline route: ${timings.step1_baseline_route.toFixed(2)}ms`)
    console.log(`  2. Prune candidates: ${timings.step2_prune_candidates.toFixed(2)}ms`)
    console.log(`  3. Build graph: ${timings.step3_build_graph.toFixed(2)}ms`)
    console.log(`  4. Dijkstra (recommended): ${timings.step4_dijkstra.toFixed(2)}ms`)
    console.log(`  5. Stitch path: ${timings.step5_stitch_path.toFixed(2)}ms`)
    console.log(`Candidates found: ${candidates.length}`)

    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message || String(err) })
  }
})


app.listen(port, () => {
  console.log(`EV Router API running at http://localhost:${port}`)
})


