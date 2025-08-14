export function useRouteManagement() {
  let routeAbortController = null

  function clearExistingRoute(map) {
    const layersToRemove = ['ev-recommended-line', 'ev-stops-circle']
    const sourcesToRemove = ['ev-recommended', 'ev-stops']
    
    layersToRemove.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId)
      }
    })
    
    sourcesToRemove.forEach(sourceId => {
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId)
      }
    })
  }

  function displayRoute(routeData, addOrUpdateSource, addOrUpdateLineLayer) {
    if (!routeData?.geojson) return
    
    addOrUpdateSource('ev-recommended', routeData.geojson)
    addOrUpdateLineLayer('ev-recommended-line', 'ev-recommended', {
      'line-color': '#0077ff',
      'line-width': 5
    })
  }

  function createStopsData(originCoords, destinationCoords, stops = []) {
    const stopsFeatures = stops.map(s => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [s.lon, s.lat] },
      properties: { ...s, type: 'stop' }
    }))

    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: originCoords },
          properties: { type: 'origin', name: 'Origin' }
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: destinationCoords },
          properties: { type: 'destination', name: 'Destination' }
        },
        ...stopsFeatures
      ]
    }
  }

  function displayStops(stopsData, map, addOrUpdateSource) {
    addOrUpdateSource('ev-stops', stopsData)
    if (!map.getLayer('ev-stops-circle')) {
      map.addLayer({
        id: 'ev-stops-circle',
        type: 'circle',
        source: 'ev-stops',
        paint: {
          'circle-radius': 4,
          'circle-color': '#fff',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#000'
        }
      })
    }
  }

  function fitMapToRoute(routeData, map) {
    if (!routeData?.geojson) return
    
    const coords = []
    for (const feature of routeData.geojson.features || []) {
      const { geometry } = feature
      if (geometry?.type === 'LineString') {
        coords.push(...geometry.coordinates)
      } else if (geometry?.type === 'MultiLineString') {
        coords.push(...geometry.coordinates.flat())
      } else if (geometry?.type === 'Point') {
        coords.push(geometry.coordinates)
      }
    }
    
    if (coords.length) {
      const lons = coords.map(c => c[0])
      const lats = coords.map(c => c[1])
      const bounds = [
        [Math.min(...lons), Math.min(...lats)],
        [Math.max(...lons), Math.max(...lats)]
      ]
      map.fitBounds(bounds, { padding: 200, duration: 800 })
    }
  }

  async function planRoute(routeData, map, { addOrUpdateSource, addOrUpdateLineLayer }) {
    console.log('Planning route:', routeData)
    
    // Cancel previous route request
    routeAbortController?.abort()
    routeAbortController = new AbortController()
    
    const { origin, destination, options } = routeData
    const originCoords = origin.coordinates
    const destinationCoords = destination.coordinates
    
    if (!originCoords || !destinationCoords) {
      console.error('Missing coordinates for origin or destination')
      return
    }

    try {
      const response = await fetch('http://192.168.1.153:3001/ev-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: originCoords,
          destination: destinationCoords,
          evRangeKm: options.evRangeKm,
          evMaxPowerKw: options.evMaxPowerKw,
          connectors: options.connectors,
          minPowerKw: options.minPowerKw
        }),
        signal: routeAbortController.signal
      })

      if (!response.ok) {
        console.error('EV route error:', await response.text())
        return
      }

      const data = await response.json()
      const recommendedRoute = data.recommended_route

      // Clear existing route and display new one
      clearExistingRoute(map)
      displayRoute(recommendedRoute, addOrUpdateSource, addOrUpdateLineLayer)
      
      // Create and display stops
      const stopsData = createStopsData(originCoords, destinationCoords, recommendedRoute?.stops)
      displayStops(stopsData, map, addOrUpdateSource)
      
      // Fit map to show the route
      fitMapToRoute(recommendedRoute, map)

      console.log('Route planned successfully:', data)
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error planning route:', error)
      }
    }
  }

  return {
    planRoute,
    clearExistingRoute
  }
}
