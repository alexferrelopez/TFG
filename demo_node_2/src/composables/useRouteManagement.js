import { useNotifications } from '@/composables/useNotifications.js'
import { createApp } from 'vue'
import RoutePopupCard from '@/components/routing/RoutePopupCard.vue'

export function useRouteManagement() {
  let routeAbortController = null
  let routePopup = null
  let routePopupApp = null

  const { showError, showWarning } = useNotifications()

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

    removeRoutePopup()
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

  function removeRoutePopup() {
    try { routePopupApp?.unmount?.() } catch (e) { }
    routePopupApp = null
    if (routePopup) {
      routePopup.remove()
      routePopup = null
    }
  }

  function showRoutePopup(map, originCoords, destinationCoords, routeLike, onBack) {
    removeRoutePopup()

    routePopup = document.createElement('div')
    routePopup.id = 'ev-route-popup'

    // Append to document body instead of map container for fixed positioning
    document.body.appendChild(routePopup)

    routePopupApp = createApp(RoutePopupCard, {
      originCoords: originCoords,
      destinationCoords: destinationCoords,
      summary: routeLike.summary || {},
      legs: routeLike.legs || [],
      stops: routeLike.stops || [],
      map: map,
      onBackToPlanner: onBack
    })
    routePopupApp.mount(routePopup)
  }

  function fitMapToRoute(map, routeData) {
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
      map.fitBounds(bounds, { padding: 200, padding: { top: 25, bottom: 25, left: 100, right: 100 }, duration: 800 })
    }
  }

  async function planRoute(routeData, map, { addOrUpdateSource, addOrUpdateLineLayer, onPopupBack }) {
    // Cancel previous route request
    routeAbortController?.abort()
    routeAbortController = new AbortController()

    const { origin, destination, options } = routeData
    const originCoords = origin.coordinates
    const destinationCoords = destination.coordinates

    if (!originCoords || !destinationCoords) {
      showError('Route Planning Failed', 'Missing origin or destination coordinates')
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
        clearExistingRoute(map)

        // Show appropriate error message based on status code
        if (response.status === 422) {
          showWarning('No Route Found', 'No feasible route found with current settings. Try adjusting your EV range or charging requirements.')
        } else if (response.status === 400) {
          showError('Invalid Request', 'Invalid route parameters. Please check your origin, destination and other preferences.')
        } else if (response.status === 504) {
          showError('Request Timeout', 'Route calculation is taking too long. Please try again.')
        } else {
          showError('Route Planning Failed', 'Unable to calculate route. Please try again later.')
        }
        return
      }

      const data = await response.json()
      const recommendedRoute = data.recommended_route

      // Clear existing route and display new one
      clearExistingRoute(map)
      displayRoute(recommendedRoute, addOrUpdateSource, addOrUpdateLineLayer)

      // Create and display stops
      const stopsData = createStopsData(originCoords, destinationCoords, recommendedRoute?.stops)
      
      //fix origin and destination name
      recommendedRoute.legs[0].from = origin.name || 'Origin'
      recommendedRoute.legs[recommendedRoute.legs.length - 1].to = destination.name || 'Destination'

      displayStops(stopsData, map, addOrUpdateSource)

      showRoutePopup(map, originCoords, destinationCoords, recommendedRoute, onPopupBack)

      // Fit map to show the route
      fitMapToRoute(map, recommendedRoute)

      // console.log('Route planned successfully:', data)
    } catch (error) {
      clearExistingRoute(map)
      if (error.name !== 'AbortError') {

        // Show user-friendly error message
        if (error.message?.includes('fetch')) {
          showError('Connection Error', 'Unable to connect to routing service. Please check your internet connection and try again.')
        } else {
          showError('Route Planning Failed', 'An unexpected error occurred while planning your route. Please try again.')
        }
      }
    }
  }

  return {
    planRoute,
    clearExistingRoute
  }
}
