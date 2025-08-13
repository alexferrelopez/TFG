// src/prune.js
import * as turf from '@turf/turf'

// --- helper ----------------------------------------------------

function hasConnectorWithMinPower(feature, wanted = ['iec62196T2COMBO'], minPowerKw = 100) {
  const rp = feature?.properties?.energyInfrastructureStation?.refillPoint
  const refillPoints = Array.isArray(rp) ? rp : (rp ? [rp] : [])

  for (const p of refillPoints) {
    const conns = Array.isArray(p?.connectors) ? p.connectors : (p?.connectors ? [p.connectors] : [])
    for (const c of conns) {
      if (!c?.connectorType) continue
      if (!wanted.includes(c.connectorType)) continue

      const kw = (c.maxPowerAtSocket || 0) / 1000
      if (kw >= minPowerKw) {
        return true // found a matching connector above threshold
      }
    }
  }
  return false
}

function isHighPowerCharger(feature, minPowerKw = 50) {
  const maxPower = feature?.properties?.max_power || 0
  const kw = maxPower / 1000
  return kw >= minPowerKw
}

export function divideChargersByPower(chargers, minPowerKw = 50) {
  const highPower = []
  const lowPower = []
  
  for (const charger of chargers) {
    if (isHighPowerCharger(charger, minPowerKw)) {
      highPower.push(charger)
    } else {
      lowPower.push(charger)
    }
  }
  
  return { highPower, lowPower }
}

// --- main ------------------------------------------------------

/**
 * Corridor pruning:
 *  1) filter by connector + min power
 *  2) keep only inside a buffer around the baseline route
 *  3) thin per segment: keep top K by percentile (then power) in each segment
 *
 * @param {Object} opts
 * @param {Array<Feature<Point>>} opts.features   Raw charger features
 * @param {Object} opts.baseLine                  LineString geometry (from ORS directions)
 * @param {Array<string>} [opts.connectors=['iec62196T2COMBO']]
 * @param {number} [opts.minPowerKw=100]
 * @param {number} [opts.bufferKm=25]
 * @param {number} [opts.segmentKm=75]
 * @param {number} [opts.topPerSegment=3]
 * @param {number} [opts.evMaxPowerKw=150]        EV max charging power for effective power calculations
 * @param {boolean} [opts.includePerformance=false] Whether to include performance timings
 * @returns {Array<Feature<Point>>|Object} Array of features, or object with features and performance if includePerformance=true
 */
export function pruneAlongCorridor(opts) {
  const startTime = performance.now()
  const timings = {}
  
  const {
    features,
    baseLine,
    connectors = ['iec62196T2COMBO'],
    minPowerKw = 100,
    bufferKm = 25,
    segmentKm = 75,
    topPerSegment = 3,
    evMaxPowerKw = 150,
    includePerformance = false
  } = opts

  // 1) Connector + power filter
  const step1Start = performance.now()
  const filtered = features.filter(f => {
    if (!f?.geometry?.coordinates) return false
    if (!hasConnectorWithMinPower(f, connectors, minPowerKw)) return false
    return true
  })
  timings.step1_connector_power_filter = performance.now() - step1Start

  if (filtered.length === 0) {
    const result = []
    return includePerformance ? { features: result, performance: { timings, candidates_after_step1: 0 } } : result
  }

  // 2) Buffer the baseline and keep points inside

  const step2aStart = performance.now()
  const simpleLine = turf.simplify(baseLine, { tolerance: 0.0005, highQuality: false })
  timings.step2a_simplify = performance.now() - step2aStart

  const step2Start = performance.now();
  const corridor = turf.buffer(simpleLine, bufferKm, { units: 'kilometers' });
  const ptsFC = turf.featureCollection(filtered.map(f => turf.point(f.geometry.coordinates, f.properties)));
  const inCorridor = turf.pointsWithinPolygon(ptsFC, corridor).features;
  timings.step2_corridor_buffer = performance.now() - step2Start
  
  if (inCorridor.length === 0) {
    const result = []
    return includePerformance ? { features: result, performance: { timings, candidates_after_step1: filtered.length, candidates_after_step2: 0 } } : result
  }

  // 3) Segment the line and pick top K per segment
  const step3Start = performance.now()
  const totalKm = turf.length(simpleLine, { units: 'kilometers' })
  const segments = Math.max(1, Math.ceil(totalKm / segmentKm))

  const picks = []
  for (let i = 0; i < segments; i++) {
    const startKm = (i / segments) * totalKm
    const endKm = ((i + 1) / segments) * totalKm
    const segLine = turf.lineSliceAlong(simpleLine, startKm, endKm, { units: 'kilometers' })
    const segBuf = turf.buffer(segLine, bufferKm, { units: 'kilometers' })

    // candidates inside this segment’s buffer
    const segPts = inCorridor.filter(f =>
      turf.booleanPointInPolygon(turf.point(f.geometry.coordinates), segBuf)
    )

    if (segPts.length === 0) continue

    // sort: higher percentile first, then higher effective power (limited by EV), then closer to segment midpoint
    const mid = turf.along(segLine, turf.length(segLine, { units: 'kilometers' }) / 2, { units: 'kilometers' })
    
    // Cache distance calculations to avoid repeated computation
    const pointsWithDistance = segPts.map(pt => ({
      point: pt,
      distance: turf.distance(mid, turf.point(pt.geometry.coordinates))
    }))
    
    pointsWithDistance.sort((a, b) => {
      const pa = Number(a.point.properties?.percentile ?? 0)
      const pb = Number(b.point.properties?.percentile ?? 0)
      if (pb !== pa) return pb - pa
      
      // Use effective power (limited by EV's max charging power)
      const stationMaxKwA = a.point.properties?.max_power / 1000 || 0
      const stationMaxKwB = b.point.properties?.max_power / 1000 || 0
      const effectiveKwA = Math.min(stationMaxKwA, evMaxPowerKw)
      const effectiveKwB = Math.min(stationMaxKwB, evMaxPowerKw)
      if (effectiveKwB !== effectiveKwA) return effectiveKwB - effectiveKwA
      
      return a.distance - b.distance
    })

    picks.push(...pointsWithDistance.slice(0, topPerSegment).map(item => item.point))
  }
  timings.step3_segment_processing = performance.now() - step3Start

  // 4) Dedupe by station id
  const step4Start = performance.now()
  const byId = new Map()
  for (const f of picks) {
    const id = f.properties?.['@id'] || JSON.stringify(f.geometry.coordinates)
    if (!byId.has(id)) byId.set(id, f)
  }
  const result = [...byId.values()]
  timings.step4_deduplication = performance.now() - step4Start

  // Calculate total time and prepare performance data
  timings.total_time = performance.now() - startTime
  
  if (includePerformance) {
    const performanceData = {
      timings_ms: timings,
      timings_formatted: {
        step1_connector_power_filter: `${timings.step1_connector_power_filter.toFixed(2)}ms`,
        step2a_simplify: `${(timings.step2a_simplify || 0).toFixed(2)}ms`,
        step2_corridor_buffer: `${timings.step2_corridor_buffer.toFixed(2)}ms`,
        step3_segment_processing: `${timings.step3_segment_processing.toFixed(2)}ms`,
        step4_deduplication: `${timings.step4_deduplication.toFixed(2)}ms`,
        total_time: `${timings.total_time.toFixed(2)}ms`
      },
      statistics: {
        input_features: features.length,
        candidates_after_step1: filtered.length,
        candidates_after_step2: inCorridor.length,
        candidates_after_step3: picks.length,
        final_features: result.length,
        segments_processed: segments,
        total_route_km: totalKm.toFixed(2)
      }
    }

    // Log performance summary to console
    console.log('=== Prune Along Corridor Performance ===')
    console.log(`Total: ${timings.total_time.toFixed(2)}ms`)
    console.log(`  1. Connector/Power filter: ${timings.step1_connector_power_filter.toFixed(2)}ms (${features.length} → ${filtered.length})`)
    console.log(`  2a. Simplify: ${timings.step2a_simplify.toFixed(2)}ms`)
    console.log(`  2. Corridor buffer: ${timings.step2_corridor_buffer.toFixed(2)}ms (${filtered.length} → ${inCorridor.length})`)
    console.log(`  3. Segment processing: ${timings.step3_segment_processing.toFixed(2)}ms (${inCorridor.length} → ${picks.length})`)
    console.log(`  4. Deduplication: ${timings.step4_deduplication.toFixed(2)}ms (${picks.length} → ${result.length})`)
    console.log(`Route: ${totalKm.toFixed(2)}km in ${segments} segments`)

    return { features: result, performance: performanceData }
  }

  return result
}
