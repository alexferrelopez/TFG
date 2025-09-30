import { ref } from 'vue'

export function useChargerLayers() {
  const chargerLayers = ref({})
  const layerVisibility = ref({
    initial_chargers: false,
    filtered_chargers: false,
    corridor_chargers: false,
    segmented_chargers: false,
    final_candidates: true
  })

  // Define layer styles for different charger types
  const layerConfigs = {
    initial_chargers: {
      color: '#999999',
      radius: 2,
      strokeColor: '#666666',
      strokeWidth: 1,
      opacity: 0.6
    },
    filtered_chargers: {
      color: '#87CEEB',
      radius: 3,
      strokeColor: '#4682B4',
      strokeWidth: 1,
      opacity: 0.7
    },
    corridor_chargers: {
      color: '#4169E1',
      radius: 3,
      strokeColor: '#191970',
      strokeWidth: 1,
      opacity: 0.8
    },
    segmented_chargers: {
      color: '#FF8C00',
      radius: 4,
      strokeColor: '#FF4500',
      strokeWidth: 2,
      opacity: 0.8
    },
    final_candidates: {
      color: '#32CD32',
      radius: 4,
      strokeColor: '#228B22',
      strokeWidth: 2,
      opacity: 0.9
    }
  }

  function createChargerGeoJSON(coordinates) {
    return {
      type: 'FeatureCollection',
      features: coordinates.map((coord, index) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: coord
        },
        properties: {
          id: index
        }
      }))
    }
  }

  function addChargerLayer(map, layerId, sourceId, config) {
    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': config.radius,
          'circle-color': config.color,
          'circle-stroke-color': config.strokeColor,
          'circle-stroke-width': config.strokeWidth,
          'circle-opacity': config.opacity,
          'circle-stroke-opacity': config.opacity
        },
        layout: {
          visibility: layerVisibility.value[layerId.replace('charger-layer-', '')] ? 'visible' : 'none'
        }
      })
    }
  }

  function updateChargerLayers(map, chargerLayersData, addOrUpdateSource) {
    if (!chargerLayersData) return

    // Store the layers data
    chargerLayers.value = chargerLayersData

    // Process each layer type
    Object.entries(chargerLayersData).forEach(([layerType, layerData]) => {
      const sourceId = `charger-source-${layerType}`
      const layerId = `charger-layer-${layerType}`
      
      if (layerData.coordinates && layerData.coordinates.length > 0) {
        // Create GeoJSON from coordinates
        const geoJson = createChargerGeoJSON(layerData.coordinates)
        
        // Add or update the source
        addOrUpdateSource(sourceId, geoJson)
        
        // Add the layer if it doesn't exist
        const config = layerConfigs[layerType]
        if (config) {
          addChargerLayer(map, layerId, sourceId, config)
        }
      }
    })
  }

  function clearChargerLayers(map) {
    Object.keys(layerConfigs).forEach(layerType => {
      const sourceId = `charger-source-${layerType}`
      const layerId = `charger-layer-${layerType}`
      
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId)
      }
      
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId)
      }
    })
    
    chargerLayers.value = {}
  }

  function toggleLayerVisibility(layerType, visible) {
    layerVisibility.value[layerType] = visible
    
    // If we have a map reference, update the layer visibility immediately
    if (window.mapInstance) {
      const layerId = `charger-layer-${layerType}`
      if (window.mapInstance.getLayer(layerId)) {
        window.mapInstance.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
      }
    }
  }

  function getLayerInfo() {
    return Object.entries(layerConfigs).map(([layerType, config]) => ({
      id: layerType,
      name: layerType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      color: config.color,
      visible: layerVisibility.value[layerType]
    }))
  }

  return {
    chargerLayers,
    layerVisibility,
    layerConfigs,
    updateChargerLayers,
    clearChargerLayers,
    toggleLayerVisibility,
    getLayerInfo
  }
}