// src/stitch.js
import { orsRoute } from './ors.js'

/**
 * Given a path as an array of node objects (each with coord & kind),
 * fetch leg geometries and produce a single FeatureCollection + stops list.
 *
 * @param {Array<{key:string, kind:string, coord:[number,number], feature?:any}>} nodesInPath
 * @returns {Promise<{ geojson: GeoJSON.FeatureCollection, stops: Array<Object>, summary: {legs:number, stops:number} }>}
 */
export async function stitchPath(nodesInPath) {
  // Build legs: [A->B, B->C, ..., Y->Z]
  const legs = []
  for (let i = 0; i < nodesInPath.length - 1; i++) {
    const a = nodesInPath[i].coord
    const b = nodesInPath[i + 1].coord
    legs.push([a, b])
  }

  // Fetch ORS directions for each leg in parallel
  const legGeo = await Promise.all(
    legs.map(coords => orsRoute(coords)) // returns FeatureCollection
  )

  // Merge leg features into one FC (keep properties per leg)
  const features = []
  for (const fc of legGeo) {
    if (fc?.features?.length) features.push(...fc.features)
  }

  // Stop markers (skip origin (0) and destination (last))
  const stops = []
  for (let i = 1; i < nodesInPath.length - 1; i++) {
    const n = nodesInPath[i]
    const p = n.feature?.properties || {}
    stops.push({
      id: p['@id'] ?? n.key,
      lon: n.coord[0],
      lat: n.coord[1],
      name: p.name,
      operator: p.operator,
      percentile: p.percentile,
      address: p.address,
      town: p.town,
      max_power: p.max_power,           // watts if that’s what you store
      connectors: p.energyInfrastructureStation?.refillPoint // raw, useful in UI
    })
  }

  return {
    geojson: { type: 'FeatureCollection', features },
    stops,
    summary: { legs: legs.length, stops: Math.max(0, nodesInPath.length - 2) }
  }
}
