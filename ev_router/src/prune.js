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
 * @returns {Array<Feature<Point>>}
 */
export function pruneAlongCorridor(opts) {
  const {
    features,
    baseLine,
    connectors = ['iec62196T2COMBO'],
    minPowerKw = 100,
    bufferKm = 25,
    segmentKm = 75,
    topPerSegment = 3
  } = opts

  // 1) Connector + power filter
  const filtered = features.filter(f => {
    if (!f?.geometry?.coordinates) return false
    if (!hasConnectorWithMinPower(f, connectors, minPowerKw)) return false
    return true
  })

  if (filtered.length === 0) return []

  // 2) Buffer the baseline and keep points inside
  const corridor = turf.buffer(baseLine, bufferKm, { units: 'kilometers' })
  const inCorridor = filtered.filter(f =>
    turf.booleanPointInPolygon(turf.point(f.geometry.coordinates), corridor)
  )
  if (inCorridor.length === 0) return []

  // 3) Segment the line and pick top K per segment
  const totalKm = turf.length(baseLine, { units: 'kilometers' })
  const segments = Math.max(1, Math.ceil(totalKm / segmentKm))

  const picks = []
  for (let i = 0; i < segments; i++) {
    const startKm = (i / segments) * totalKm
    const endKm = ((i + 1) / segments) * totalKm
    const segLine = turf.lineSliceAlong(baseLine, startKm, endKm, { units: 'kilometers' })
    const segBuf = turf.buffer(segLine, bufferKm, { units: 'kilometers' })

    // candidates inside this segment’s buffer
    const segPts = inCorridor.filter(f =>
      turf.booleanPointInPolygon(turf.point(f.geometry.coordinates), segBuf)
    )

    if (segPts.length === 0) continue

    // sort: higher percentile first, then higher power, then closer to segment midpoint
    const mid = turf.along(segLine, turf.length(segLine, { units: 'kilometers' }) / 2, { units: 'kilometers' })
    segPts.sort((a, b) => {
      const pa = Number(a.properties?.percentile ?? 0)
      const pb = Number(b.properties?.percentile ?? 0)
      if (pb !== pa) return pb - pa
      const ka = a.properties?.max_power / 1000 || 0
      const kb = b.properties?.max_power / 1000 || 0
      if (kb !== ka) return kb - ka
      const da = turf.distance(mid, turf.point(a.geometry.coordinates))
      const db = turf.distance(mid, turf.point(b.geometry.coordinates))
      return da - db
    })

    picks.push(...segPts.slice(0, topPerSegment))
  }

  // dedupe by station id (your sample has properties['@id'])
  const byId = new Map()
  for (const f of picks) {
    const id = f.properties?.['@id'] || JSON.stringify(f.geometry.coordinates)
    if (!byId.has(id)) byId.set(id, f)
  }

  return [...byId.values()]
}
