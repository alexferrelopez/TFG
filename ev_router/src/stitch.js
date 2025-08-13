// src/stitch.js
import { orsRoute } from './ors.js'
import { estimateChargingTimeSeconds } from './solver.js'

/**
 * Given a path as an array of node objects (each with coord & kind),
 * fetch leg geometries and produce a single FeatureCollection + stops list.
 *
 * @param {Array<{key:string, kind:string, coord:[number,number], feature?:any}>} nodesInPath
 * @param {number} [evMaxPowerKw=150] - Max charging power of the EV for charging time calculation
 * @returns {Promise<{ 
 *   geojson: GeoJSON.FeatureCollection, 
 *   stops: Array<Object>, 
 *   legs: Array<Object>,
 *   summary: {legs:number, stops:number, totalDuration:number, totalDistance:number, totalChargingTime:number, totalTripTime:number} 
 * }>}
 */
export async function stitchPath(nodesInPath, evMaxPowerKw = 150) {
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

  // Merge leg features and calculate totals in one pass
  const features = []
  const legDetails = []
  let totalDuration = 0
  let totalDistance = 0
  
  for (let i = 0; i < legGeo.length; i++) {
    const fc = legGeo[i]
    let legDuration = 0
    let legDistance = 0
    
    if (fc?.features?.length) {
      features.push(...fc.features)
      // Sum up duration and distance from each leg
      for (const feature of fc.features) {
        if (feature.properties?.summary) {
          const duration = feature.properties.summary.duration || 0
          const distance = feature.properties.summary.distance || 0
          legDuration += duration
          legDistance += distance
          totalDuration += duration
          totalDistance += distance
        }
      }
    }
    
    // Create leg detail while we're iterating
    legDetails.push({
      legIndex: i,
      from: nodesInPath[i].kind === 'origin' ? 'Origin' : 
            nodesInPath[i].feature?.properties?.name || `Stop ${i}`,
      to: nodesInPath[i + 1].kind === 'destination' ? 'Destination' : 
          nodesInPath[i + 1].feature?.properties?.name || `Stop ${i + 1}`,
      duration: legDuration, // seconds
      distance: legDistance, // meters
      durationFormatted: `${Math.floor(legDuration / 3600)}h ${Math.floor((legDuration % 3600) / 60)}m`,
      distanceFormatted: `${(legDistance / 1000).toFixed(1)} km`
    })
  }

  // Calculate charging time and create stops in one pass
  const stops = []
  let totalChargingTime = 0
  
  for (let i = 1; i < nodesInPath.length - 1; i++) {
    const n = nodesInPath[i]
    const p = n.feature?.properties || {}
    const chargingTime = estimateChargingTimeSeconds(n.feature, evMaxPowerKw)
    
    // Add to total charging time
    if (n.kind === 'charger' && n.feature) {
      totalChargingTime += chargingTime
    }
    
    stops.push({
      id: p['@id'] ?? n.key,
      lon: n.coord[0],
      lat: n.coord[1],
      name: p.name,
      operator: p.operator,
      address: p.address,
      town: p.town,
      max_power: p.max_power,
      estimatedChargingTimeSeconds: chargingTime,
      estimatedChargingTimeFormatted: `${Math.floor(chargingTime / 60)}m`
    })
  }

  return {
    geojson: { type: 'FeatureCollection', features },
    stops,
    legs: legDetails, // Detailed breakdown of each leg
    summary: { 
      legs: legs.length, 
      stops: Math.max(0, nodesInPath.length - 2),
      totalDuration: totalDuration, // driving time in seconds
      totalDistance: totalDistance, // in meters
      totalChargingTime: totalChargingTime, // charging time in seconds
      totalTripTime: totalDuration + totalChargingTime, // complete trip time in seconds
      totalDurationFormatted: `${Math.floor(totalDuration / 3600)}h ${Math.floor((totalDuration % 3600) / 60)}m`,
      totalDistanceFormatted: `${(totalDistance / 1000).toFixed(1)} km`,
      totalChargingTimeFormatted: `${Math.floor(totalChargingTime / 3600)}h ${Math.floor((totalChargingTime % 3600) / 60)}m`,
      totalTripTimeFormatted: `${Math.floor((totalDuration + totalChargingTime) / 3600)}h ${Math.floor(((totalDuration + totalChargingTime) % 3600) / 60)}m`
    }
  }
}
