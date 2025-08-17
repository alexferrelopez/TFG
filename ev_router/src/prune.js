// src/prune.js
import * as turf from '@turf/turf'

// --- helpers ----------------------------------------------------

export function normalizeToArray(value) {
  return Array.isArray(value) ? value : (value ? [value] : [])
}

function hasConnectorWithMinPower(feature, wanted = ['iec62196T2COMBO'], minPowerKw = 100) {
  const refillPoints = normalizeToArray(feature?.properties?.energyInfrastructureStation?.refillPoint)

  return refillPoints.some(point => {
    const connectors = normalizeToArray(point?.connectors)
    return connectors.some(connector => {
      if (!connector?.connectorType || !wanted.includes(connector.connectorType)) return false
      return (connector.maxPowerAtSocket || 0) / 1000 >= minPowerKw
    })
  })
}

// --- main ------------------------------------------------------

function createPointsFromFeatures(features) {
  return turf.featureCollection(
    features.map(f => turf.point(f.geometry.coordinates, f.properties))
  )
}

function calculateChargerScore(feature, wanted = ['iec62196T2COMBO'], minPowerKw = 100) {
  const props = feature.properties || {}
  const refillPoints = normalizeToArray(props?.energyInfrastructureStation?.refillPoint)
  
  let totalScore = 0

  refillPoints.forEach(point => {
    const connectors = normalizeToArray(point?.connectors)
    
    // Find maximum power among wanted connectors in this refill point
    let maxRefillPointPower = 0
    const hasWantedConnector = connectors.some(connector => {
      if (!connector?.connectorType || !wanted.includes(connector.connectorType)) return false
      const powerKw = (connector.maxPowerAtSocket || 0) / 1000
      maxRefillPointPower = Math.max(maxRefillPointPower, powerKw)
      return true
    })

    // Only count this refill point if it has wanted connectors and meets minimum power
    if (hasWantedConnector && maxRefillPointPower >= minPowerKw) {
      totalScore += 1 
    }
  })

  return totalScore
}

function sortSegmentPoints(points, segmentLine, wanted = ['iec62196T2COMBO'], minPowerKw = 100) {
  // Calculate segment midpoint for tie-breaking
  const segmentMidpoint = turf.along(
    segmentLine, 
    turf.length(segmentLine, { units: 'kilometers' }) / 2, 
    { units: 'kilometers' }
  )

  return points
    .map(pt => ({
      point: pt,
      score: calculateChargerScore(pt, wanted, minPowerKw),
      distance: turf.distance(segmentMidpoint, turf.point(pt.geometry.coordinates))
    }))
    .sort((a, b) => {
      // Primary sort by calculated score (higher is better)
      const scoreDiff = b.score - a.score
      //if (Math.abs(scoreDiff) > 0.1) return scoreDiff // Use score if difference is meaningful
      
      // Fallback to distance to midpoint for ties (faster calculation)
      return a.distance - b.distance
    })
    .map(item => item.point)
}

function deduplicateByStationId(features) {
  const byId = new Map()
  features.forEach(f => {
    const id = f.properties?.['@id'] || JSON.stringify(f.geometry.coordinates)
    if (!byId.has(id)) byId.set(id, f)
  })
  return [...byId.values()]
}

/**
 * Corridor pruning:
 *  1) filter by connector + min power
 *  2) keep only inside a buffer around the baseline route
 *  3) thin per segment: keep top K in each segment
 *
 * @param {Object} opts
 * @param {Array<Feature<Point>>} opts.features   Raw charger features
 * @param {Object} opts.baseLine                  LineString geometry (from ORS directions)
 * @param {Array<string>} [opts.connectors=['iec62196T2COMBO']]
 * @param {number} [opts.minPowerKw=100]
 * @param {number} [opts.bufferKm=25]
 * @param {number} [opts.segmentKm=75]
 * @param {number} [opts.maxOrsCandidates=120]
 * @returns {Array<Feature<Point>>} Array of pruned charger features
 */
export function pruneAlongCorridor(opts) {
  const {
    features,
    baseLine,
    connectors = ['iec62196T2COMBO'],
    minPowerKw = 100,
    bufferKm = 25,
    segmentKm = 75,
    maxOrsCandidates = 120
  } = opts

  // 1) Filter by connector and power requirements
  const validChargers = features.filter(f => 
    f?.geometry?.coordinates && hasConnectorWithMinPower(f, connectors, minPowerKw)
  )

  if (validChargers.length === 0) return []

  // 2) Keep only points within corridor buffer
  const simpleLine = turf.simplify(baseLine, { tolerance: 0.0005, highQuality: false })
  const corridor = turf.buffer(simpleLine, bufferKm, { units: 'kilometers' })
  const pointsInCorridor = turf.pointsWithinPolygon(createPointsFromFeatures(validChargers), corridor).features

  if (pointsInCorridor.length === 0) return []

  // 3) Process segments and select top chargers per segment
  const totalKm = turf.length(simpleLine, { units: 'kilometers' })
  const segments = Math.max(1, Math.ceil(totalKm / segmentKm))
  const topPerSegment = Math.floor(maxOrsCandidates / segments)
  const selectedChargers = []

  for (let i = 0; i < segments; i++) {
    const startKm = (i / segments) * totalKm
    const endKm = ((i + 1) / segments) * totalKm
    const segmentLine = turf.lineSliceAlong(simpleLine, startKm, endKm, { units: 'kilometers' })
    const segmentBuffer = turf.buffer(segmentLine, bufferKm, { units: 'kilometers' })

    // Find chargers within this segment
    const segmentChargers = pointsInCorridor.filter(f =>
      turf.booleanPointInPolygon(turf.point(f.geometry.coordinates), segmentBuffer)
    )

    if (segmentChargers.length === 0) continue

    // Sort and select top chargers for this segment
    const sortedChargers = sortSegmentPoints(segmentChargers, segmentLine, connectors, minPowerKw)
    selectedChargers.push(...sortedChargers.slice(0, topPerSegment))
  }

  const deduplicatedChargers = deduplicateByStationId(selectedChargers)

  console.log(`Maximum possible chargers: ${segments * topPerSegment}, ${topPerSegment} candidates per segment`)
  console.log(`Retained ${selectedChargers.length} chargers within corridor`)
  console.log(`Pruned ${deduplicatedChargers.length} unique chargers along corridor`)

  // 4) Remove duplicates by station ID
  return deduplicatedChargers
}
