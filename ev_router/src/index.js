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
import { pruneAlongCorridor } from './prune.js'


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

// Test route
app.get('/', (req, res) => {
  res.json({ ok: true, chargers: chargers.length })
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
      connectors = ['iec62196T2COMBO'],
      minPowerKw = Number(process.env.MIN_POWER_KW || 100),
      bufferKm = Number(process.env.BUFFER_KM || 25),
      segmentKm = Number(process.env.SEGMENT_KM || 75),
      topPerSegment = 3,
      stopPenaltySec = Number(process.env.STOP_PENALTY_SEC || 900)
    } = req.body

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
    const candidates = pruneAlongCorridor({
      features: chargers,
      baseLine,
      connectors,
      minPowerKw,
      bufferKm,
      segmentKm,
      topPerSegment
    })
    timings.step2_prune_candidates = performance.now() - step2Start

    // 3) Build EV-feasible graph from O + candidates + D
    const step3Start = performance.now()
    const { nodes, makeGraph } = await buildChargerGraph({
      origin, destination, chargers: candidates, evRangeKm
    })
    timings.step3_build_graph = performance.now() - step3Start

    // handy index by key
    const byKey = Object.fromEntries(nodes.map(n => [n.key, n]))

    // 4a) FASTEST: durations + stop penalties (+ low power bias)
    const step4aStart = performance.now()
    const G_time = makeGraph({ weight: 'duration', stopPenaltySec, addLowPowerBias: true })
    let fastestKeys
    try {
      fastestKeys = dijkstra.find_path(G_time, 'O', 'D')
    } catch {
      fastestKeys = null
    }
    timings.step4a_dijkstra_fastest = performance.now() - step4aStart

    // 4b) SHORTEST: distance + tiny stop penalty, no bias
    const step4bStart = performance.now()
    const G_dist = makeGraph({ weight: 'distance', stopPenaltySec: 1, addLowPowerBias: false })
    let shortestKeys
    try {
      shortestKeys = dijkstra.find_path(G_dist, 'O', 'D')
    } catch {
      shortestKeys = null
    }
    timings.step4b_dijkstra_shortest = performance.now() - step4bStart

    // If no feasible path, report helpful info
    if (!fastestKeys && !shortestKeys) {
      return res.status(422).json({
        error: 'No feasible route within range and filters',
        diagnostics: {
          candidates_considered: candidates.length,
          hint: 'Try increasing range, lowering minPowerKw, or widening bufferKm'
        }
      })
    }

    // 5) Stitch legs for any successful path
    const result = { baseline: baseline } // keep baseline for debugging/overlay
    if (fastestKeys) {
      const fastestNodes = fastestKeys.map(k => byKey[k])
      result.fastest = await stitchPath(fastestNodes)
    }
    if (shortestKeys) {
      const shortestNodes = shortestKeys.map(k => byKey[k])
      result.shortest = await stitchPath(shortestNodes)
    }

    // add small summaries (optional)
    result.summary = {
      candidates: candidates.length,
      fastest: result.fastest?.summary || null,
      shortest: result.shortest?.summary || null
    }

    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message || String(err) })
  }
})

app.get('/test-prune', (req, res) => {
  const lon = parseFloat(req.query.lon);
  const lat = parseFloat(req.query.lat);
  const range = parseFloat(req.query.range || '1');

  if (isNaN(lon) || isNaN(lat)) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

  const result = pruneChargers(chargers, [lon, lat], range, 50);
  res.json({ count: result.length, features: result });
});

app.post('/test-route', async (req, res) => {
  const { coords } = req.body // Expects array of [lon, lat] pairs

  if (!Array.isArray(coords) || coords.length < 2) {
    return res.status(400).json({ error: 'Need at least 2 coordinates' })
  }

  try {
    const route = await orsRoute(coords)
    res.json({ ok: true, route })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.post('/test-matrix', async (req, res) => {
  const { coords } = req.body

  if (!Array.isArray(coords) || coords.length < 2) {
    return res.status(400).json({ error: 'Need at least 2 coordinates' })
  }

  try {
    const matrix = await orsMatrix(coords)
    res.json({ ok: true, matrix })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})


app.listen(port, () => {
  console.log(`EV Router API running at http://localhost:${port}`)
})


