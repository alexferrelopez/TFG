// src/solver.js
import { orsMatrix } from './ors.js'

// Pull lon/lat from a Feature<Point>
function coordOf(feature) {
  const [lon, lat] = feature.geometry.coordinates
  return [lon, lat]
}

// Optional: small bias against lower-power stations when optimizing time
function lowPowerBiasSeconds(feature) {
  const maxW = Number(feature.properties?.max_power || 0)
  const kw = maxW / 1000
  // 0s penalty ≥150kW, up to +10min at 50kW
  const clamped = Math.max(50, Math.min(150, kw))
  const deficit = 150 - clamped // 0..100
  return Math.round((deficit / 100) * 600) // 0..600 sec
}

/**
 * Build EV-feasible graph from origin/destination + candidate chargers.
 *
 * @param {Object} opts
 * @param {[number,number]} opts.origin
 * @param {[number,number]} opts.destination
 * @param {Array<Feature<Point>>} opts.chargers     // pruned candidates (raw features)
 * @param {number} opts.evRangeKm                    // vehicle range in km
 *
 * @returns {{
 *   nodes: Array<{ key:string, kind:'origin'|'charger'|'destination', coord:[number,number], feature?:any }>,
 *   distances: number[][],
 *   durations: number[][],
 *   feasible: Array<Record<number, true>>,
 *   makeGraph: (args?:{weight:'duration'|'distance', stopPenaltySec?:number, addLowPowerBias?:boolean}) => Record<string,Record<string,number>>
 * }}
 */
export async function buildChargerGraph({ origin, destination, chargers, evRangeKm }) {
  // 1) Build nodes list
  const nodes = []
  nodes.push({ key: 'O', kind: 'origin', coord: origin })
  for (const f of chargers) {
    const id = String(f.properties?.['@id'] ?? JSON.stringify(f.geometry.coordinates))
    nodes.push({ key: id, kind: 'charger', coord: coordOf(f), feature: f })
  }
  nodes.push({ key: 'D', kind: 'destination', coord: destination })

  // 2) Coords array for ORS /matrix
  const coords = nodes.map(n => n.coord)

  // 3) Fetch matrix (distance + duration)
  const { distances, durations } = await orsMatrix(coords) // meters & seconds

  // 4) Feasibility (edge exists iff leg distance ≤ range)
  const N = nodes.length
  const maxLegMeters = evRangeKm * 1000
  const feasible = Array.from({ length: N }, () => ({}))

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      if (i === j) continue
      const d = distances?.[i]?.[j]
      if (d != null && Number.isFinite(d) && d > 0 && d <= maxLegMeters) {
        feasible[i][j] = true
      }
    }
  }

  // 5) Helper to produce a dijkstrajs adjacency with chosen weight
  function makeGraph({ weight = 'duration', stopPenaltySec = 900, addLowPowerBias = true } = {}) {
    // dijkstrajs expects: { nodeKey: { neighborKey: cost, ... }, ... }
    const G = {}
    for (let i = 0; i < N; i++) {
      const fromKey = nodes[i].key
      G[fromKey] = {}
      for (let j = 0; j < N; j++) {
        if (!feasible[i][j]) continue
        const to = nodes[j]
        const base =
          weight === 'distance'
            ? distances[i][j] // meters
            : durations[i][j] // seconds

        // Add stop penalty when ARRIVING at a charger (not origin/destination)
        let penalty = 0
        if (to.kind === 'charger') {
          penalty += weight === 'distance' ? 1 /* tiny deterrent in meters */ : stopPenaltySec
          if (addLowPowerBias && weight === 'duration' && to.feature) {
            penalty += lowPowerBiasSeconds(to.feature)
          }
        }

        // Final edge weight; keep strictly positive & finite
        const w = base + penalty
        if (Number.isFinite(w) && w > 0) {
          G[fromKey][to.key] = w
        }
      }
    }
    return G
  }

  return { nodes, distances, durations, feasible, makeGraph }
}
