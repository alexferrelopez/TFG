// src/solver.js
import { orsMatrix } from './ors.js'

// Pull lon/lat from a Feature<Point>
function coordOf(feature) {
  const [lon, lat] = feature.geometry.coordinates
  return [lon, lat]
}

function estimateChargingTimeSeconds(feature, evMaxPowerKw = 150) {
  const stationMaxW = Number(feature.properties?.max_power || 0)
  const stationMaxKw = stationMaxW / 1000
  
  // Effective power is limited by both station and EV capabilities
  const effectiveKw = Math.min(stationMaxKw, evMaxPowerKw)
  
  if (effectiveKw <= 0) return 3600 // 1 hour penalty for unusable chargers

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

// Calculate time penalty compared to optimal charging speed
function lowPowerBiasSeconds(feature, evMaxPowerKw = 150) {
  const actualTime = estimateChargingTimeSeconds(feature, evMaxPowerKw)
  
  const optimalPowerKw = Math.min(150, evMaxPowerKw)
  const optimalChargerFeature = {
    properties: { max_power: optimalPowerKw * 1000 }
  }
  const optimalTime = estimateChargingTimeSeconds(optimalChargerFeature, evMaxPowerKw)
  
  return Math.max(0, actualTime - optimalTime)
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
 *
 * @returns {{
 *   nodes: Array<{ key:string, kind:'origin'|'charger'|'destination', coord:[number,number], feature?:any }>,
 *   graph: Record<string,Record<string,number>>
 * }}
 */
export async function buildChargerGraph({ origin, destination, chargers, evRangeKm, evMaxPowerKw = 150 }) {
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

      if (to.kind === 'charger') {
        if (to.feature) {
          edgeWeight += lowPowerBiasSeconds(to.feature, evMaxPowerKw)
        }
      }

      if (Number.isFinite(edgeWeight) && edgeWeight > 0) {
        graph[fromKey][to.key] = edgeWeight
      }
    }
  }

  return { nodes, graph }
}
