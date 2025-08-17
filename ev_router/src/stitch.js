// src/stitch.js
import { orsRoute } from './ors.js'
import { estimateChargingTimeSeconds, getStationMaxPower } from './solver.js'

// Utility functions for formatting
function formatDuration(seconds) {
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

function formatDistance(meters) {
  return `${(meters / 1000).toFixed(1)} km`
}

function getNodeDisplayName(node, index, kind) {
  if (kind === 'origin') return 'Origin'
  if (kind === 'destination') return 'Destination'
  return node.feature?.properties?.name || `Stop ${index}`
}

function createStop(node, evMaxPowerKw, connectors, minPowerKw) {
  const properties = node.feature?.properties || {}

  const { maxPower, validConnectors } = getStationMaxPower(node.feature, connectors, minPowerKw)

  const chargingTime = estimateChargingTimeSeconds(node.feature, evMaxPowerKw, connectors, minPowerKw)

  return {
    id: properties['@id'] ?? node.key,
    lon: node.coord[0],
    lat: node.coord[1],
    name: properties.name,
    operator: properties.operator,
    address: properties.address,
    town: properties.town,
    max_power: maxPower,
    maxPowerFormatted: `${maxPower} kW`,
    validConnectors: validConnectors,
    estimatedChargingTimeSeconds: chargingTime,
    estimatedChargingTimeFormatted: `${Math.floor(chargingTime / 60)}m`
  }
}

function processLegGeometry(legGeo, nodeFrom, nodeTo, legIndex) {
  const features = []
  let legDuration = 0
  let legDistance = 0
  
  if (legGeo?.features?.length) {
    features.push(...legGeo.features)
    // Sum up duration and distance from this leg
    for (const feature of legGeo.features) {
      if (feature.properties?.summary) {
        legDuration += feature.properties.summary.duration || 0
        legDistance += feature.properties.summary.distance || 0
      }
    }
  }
  
  return {
    features,
    legDetail: {
      legIndex,
      from: getNodeDisplayName(nodeFrom, legIndex, nodeFrom.kind),
      to: getNodeDisplayName(nodeTo, legIndex + 1, nodeTo.kind),
      duration: legDuration,
      distance: legDistance,
      durationFormatted: formatDuration(legDuration),
      distanceFormatted: formatDistance(legDistance)
    },
    duration: legDuration,
    distance: legDistance
  }
}

/**
 * Given a path as an array of node objects (each with coord & kind),
 * fetch leg geometries and produce a single FeatureCollection + stops list.
 *
 * @param {Array<{key:string, kind:string, coord:[number,number], feature?:any}>} nodesInPath
 * @param {number} [evMaxPowerKw=150] - Max charging power of the EV for charging time calculation
 * @param {Array<string>} connectors - Supported connector types
 * @param {number} minPowerKw - Minimum power requirement for charging
 * @returns {Promise<{ 
 *   geojson: GeoJSON.FeatureCollection, 
 *   stops: Array<Object>, 
 *   legs: Array<Object>,
 *   summary: {legs:number, stops:number, totalDuration:number, totalDistance:number, totalChargingTime:number, totalTripTime:number} 
 * }>}
 */
export async function stitchPath(nodesInPath, evMaxPowerKw = 150, connectors, minPowerKw) {
  // Fetch ORS directions for each consecutive pair of nodes
  const legPromises = []
  for (let i = 0; i < nodesInPath.length - 1; i++) {
    const coords = [nodesInPath[i].coord, nodesInPath[i + 1].coord]
    legPromises.push(orsRoute(coords))
  }
  
  const legGeometries = await Promise.all(legPromises)

  // Process all legs and accumulate results
  const allFeatures = []
  const legDetails = []
  const totals = { duration: 0, distance: 0, chargingTime: 0 }
  
  for (let i = 0; i < legGeometries.length; i++) {
    const result = processLegGeometry(
      legGeometries[i], 
      nodesInPath[i], 
      nodesInPath[i + 1], 
      i
    )
    
    allFeatures.push(...result.features)
    legDetails.push(result.legDetail)
    totals.duration += result.duration
    totals.distance += result.distance
  }

  // Create stops and calculate total charging time
  const stops = []
  for (let i = 1; i < nodesInPath.length - 1; i++) {
    const node = nodesInPath[i]
    const stop = createStop(node, evMaxPowerKw, connectors, minPowerKw)
    stops.push(stop)
    
    if (node.kind === 'charger' && node.feature) {
      totals.chargingTime += stop.estimatedChargingTimeSeconds
    }
  }

  const totalTripTime = totals.duration + totals.chargingTime

  return {
    geojson: { type: 'FeatureCollection', features: allFeatures },
    stops,
    legs: legDetails,
    summary: { 
      legs: legGeometries.length, 
      stops: Math.max(0, nodesInPath.length - 2),
      totalDuration: totals.duration,
      totalDistance: totals.distance,
      totalChargingTime: totals.chargingTime,
      totalTripTime,
      totalDurationFormatted: formatDuration(totals.duration),
      totalDistanceFormatted: formatDistance(totals.distance),
      totalChargingTimeFormatted: formatDuration(totals.chargingTime),
      totalTripTimeFormatted: formatDuration(totalTripTime)
    }
  }
}
