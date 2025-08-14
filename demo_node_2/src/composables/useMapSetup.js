import { ref } from 'vue'
import maplibregl from 'maplibre-gl'

export function useMapSetup() {
  const isNorth = ref(false)
  const bearing = ref(0)
  let map = null

  function updateDirection() {
    const b = ((map.getBearing() % 360) + 360) % 360
    bearing.value = b
    isNorth.value = Math.abs(b) < 0.5
  }

  function resetNorth() {
    map.rotateTo(0, { duration: 800 })
  }

  function addOrUpdateSource(id, data) {
    if (!map.getSource(id)) {
      map.addSource(id, { type: 'geojson', data })
    } else {
      map.getSource(id).setData(data)
    }
  }

  function addOrUpdateLineLayer(layerId, sourceId, paint) {
    if (!map.getLayer(layerId)) {
      map.addLayer({ id: layerId, type: 'line', source: sourceId, paint })
    } else {
      Object.entries(paint).forEach(([k, v]) => map.setPaintProperty(layerId, k, v))
    }
  }

  function initializeMap() {
    map = new maplibregl.Map({
      container: 'map',
      style: 'http://192.168.1.153:3000/style/style',
      center: [3.7492, 40.4637],
      zoom: 2,
      maxZoom: 19,
      minZoom: 4,
      hash: true,
      antialias: true
    })

    map.on('load', () => {
      updateDirection()
    })

    map.on('rotate', updateDirection)
    map.on('moveend', updateDirection)

    // Cursor changes
    map.on("mouseenter", "chargers-point", () => {
      map.getCanvas().style.cursor = "pointer"
    })
    map.on("mouseleave", "chargers-point", () => {
      map.getCanvas().style.cursor = ""
    })

    return map
  }

  return {
    map: () => map,
    isNorth,
    bearing,
    updateDirection,
    resetNorth,
    addOrUpdateSource,
    addOrUpdateLineLayer,
    initializeMap
  }
}
