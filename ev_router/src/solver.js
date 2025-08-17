// src/solver.js
import { orsMatrix } from './ors.js'
import { normalizeToArray } from './prune.js'

// Pull lon/lat from a Feature<Point>
function coordOf(feature) {
  const [lon, lat] = feature.geometry.coordinates
  return [lon, lat]
}


export function getStationMaxPower(feature, wanted, minPowerKw = 100) {
  const props = feature.properties || {}
  const refillPoints = normalizeToArray(props?.energyInfrastructureStation?.refillPoint)

  let maxPower = 0
  let validConnectors = 0

  refillPoints.forEach(point => {
    normalizeToArray(point?.connectors).forEach(connector => {
      if (!connector?.connectorType || !wanted.includes(connector.connectorType)) return
      const powerKw = (connector.maxPowerAtSocket || 0) / 1000
      if (powerKw >= minPowerKw) {
        maxPower = Math.max(maxPower, powerKw)
        validConnectors++
      }
    })
  })

  return { maxPower, validConnectors }
}

export function estimateChargingTimeSeconds(feature, evMaxPowerKw, connectors, minPowerKw) {
  const { maxPower } = getStationMaxPower(feature, connectors, minPowerKw)

  // Effective power is limited by both station and EV capabilities
  const effectiveKw = Math.min(maxPower, evMaxPowerKw)

  if (effectiveKw <= 0) return Infinity

  let estimatedMinutes
  if (effectiveKw >= 150) {
    estimatedMinutes = 25
  } else if (effectiveKw >= 100) {
    estimatedMinutes = 35
  } else if (effectiveKw >= 75) {
    estimatedMinutes = 45
  } else if (effectiveKw >= 50) {
    estimatedMinutes = 60
  } else if (effectiveKw >= 25) {
    estimatedMinutes = 90
  } else {
    estimatedMinutes = 180
  }

  return (estimatedMinutes) * 60 // Convert to seconds
}

/**
 * Build EV-feasible graph from origin/destination + candidate chargers.
 * Creates a time-optimized routing graph with stop penalties and realistic charging time estimates.
 *
 * @param {Object} opts
 * @param {[number,number]} opts.origin
 * @param {[number,number]} opts.destination
 * @param {Array<Feature<Point>>} opts.chargers     // pruned candidates (raw features)
 * @param {number} opts.evRangeKm                    // vehicle range in km
 * @param {number} [opts.evMaxPowerKw=150]           // max charging power of the EV
 * @param {Array<string>} [opts.connectors]          // supported connector types
 *
 * @returns {{
 *   nodes: Array<{ key:string, kind:'origin'|'charger'|'destination', coord:[number,number], feature?:any }>,
 *   graph: Record<string,Record<string,number>>
 * }}
 */
export async function buildChargerGraph({ origin, destination, chargers, evRangeKm, evMaxPowerKw = 150, connectors, minPowerKw}) {
  // 1) Build nodes list
  const nodes = [
    { key: 'O', kind: 'origin', coord: origin },
    ...chargers.map(f => ({
      key: String(f.properties?.['@id'] ?? JSON.stringify(f.geometry.coordinates)),
      kind: 'charger',
      coord: coordOf(f),
      feature: f
    })),
    { key: 'D', kind: 'destination', coord: destination }
  ]

  // 2) Fetch matrix (distance + duration)
  const { distances, durations } = await orsMatrix(nodes.map(n => n.coord))

  // 3) Build time-optimized graph with stop penalties and low-power bias
  const maxLegMeters = evRangeKm * 1000
  const graph = {}

  for (let i = 0; i < nodes.length; i++) {
    const fromKey = nodes[i].key
    graph[fromKey] = {}

    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue

      const distance = distances?.[i]?.[j]
      // Check feasibility: edge exists iff leg distance ≤ range
      if (!distance || !Number.isFinite(distance) || distance <= 0 || distance > maxLegMeters) {
        continue
      }

      const to = nodes[j]
      let edgeWeight = durations[i][j] // base time in seconds

      if (to.kind === 'charger' && to.feature) {
        edgeWeight += estimateChargingTimeSeconds(to.feature, evMaxPowerKw, connectors, minPowerKw)
      }

      if (Number.isFinite(edgeWeight) && edgeWeight > 0) {
        graph[fromKey][to.key] = edgeWeight
      }
    }
  }

  return { nodes, graph }
}
