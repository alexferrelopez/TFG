// src/prune.js
import * as turf from '@turf/turf'

// --- helpers ----------------------------------------------------

function normalizeToArray(value) {
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

function isHighPowerCharger(feature, minPowerKw = 50) {
  return (feature?.properties?.max_power || 0) / 1000 >= minPowerKw
}

export function divideChargersByPower(chargers, minPowerKw = 50) {
  return chargers.reduce((acc, charger) => {
    const target = isHighPowerCharger(charger, minPowerKw) ? 'highPower' : 'lowPower'
    acc[target].push(charger)
    return acc
  }, { highPower: [], lowPower: [] })
}

// --- main ------------------------------------------------------

function createPointsFromFeatures(features) {
  return turf.featureCollection(
    features.map(f => turf.point(f.geometry.coordinates, f.properties))
  )
}

function sortSegmentPoints(points, segmentMidpoint, evMaxPowerKw) {
  return points
    .map(pt => ({
      point: pt,
      distance: turf.distance(segmentMidpoint, turf.point(pt.geometry.coordinates))
    }))
    .sort((a, b) => {
      // Sort by percentile (higher first)
      const percentileDiff = (b.point.properties?.percentile || 0) - (a.point.properties?.percentile || 0)
      if (percentileDiff !== 0) return percentileDiff
      
      // Then by effective power (higher first)
      const effectivePowerA = Math.min((a.point.properties?.max_power || 0) / 1000, evMaxPowerKw)
      const effectivePowerB = Math.min((b.point.properties?.max_power || 0) / 1000, evMaxPowerKw)
      const powerDiff = effectivePowerB - effectivePowerA
      if (powerDiff !== 0) return powerDiff
      
      // Finally by distance (closer first)
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
    topPerSegment = 3,
    evMaxPowerKw = 150
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
    const segmentMidpoint = turf.along(
      segmentLine, 
      turf.length(segmentLine, { units: 'kilometers' }) / 2, 
      { units: 'kilometers' }
    )
    
    const sortedChargers = sortSegmentPoints(segmentChargers, segmentMidpoint, evMaxPowerKw)
    selectedChargers.push(...sortedChargers.slice(0, topPerSegment))
  }

  // 4) Remove duplicates by station ID
  return deduplicateByStationId(selectedChargers)
}
