<template>
  <div class="search-container">
    <SearchBar @select="handleLocationSelect" />
  </div>
  <transition name="slide">
    <SideCard v-if="selectedStation || selectedLocation" :key="selectedStation?.id || selectedLocation?.display_name"
      :forceExpand="forceExpand" @close="closeSideCard">
      <StationCard v-if="selectedStation" :chargingStation="selectedStation"
        @setAsDestination="handleSetAsDestination" />
      <RouteCard v-else-if="selectedLocation" :selectedLocation="selectedLocation" :autoPlan="autoPlan"
        @planRoute="handlePlanRoute"/>
    </SideCard>
  </transition>

  <div class="map-container">
    <div id="map" class="map-placeholder"></div>
    <div class="bottom-right-controls">
      <CompassButton :bearing="bearing" :isNorth="isNorth" @reset="resetNorth" />
      <ChargerFilters v-model:showHigh="showHigh" v-model:showMid="showMid" v-model:showLow="showLow"
        v-model:showVeryHigh="showVeryHigh" />
      <div id="route-popup-container"></div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, createApp } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import CompassButton from '@/components/ui/CompassButton.vue'
import StationCard from '@/components/chargers/StationCard.vue'
import RouteCard from '@/components/routing/RouteCard.vue'
import ChargerFilters from '@/components/ui/ChargerFilters.vue'
import SideCard from '@/components/layout/SideCard.vue'
import SearchBar from '@/components/ui/SearchBar.vue'
import ChargerPopup from '@/components/chargers/ChargerPopup.vue'
import { useMapSetup } from '@/composables/useMapSetup.js'
import { useRouteManagement } from '@/composables/useRouteManagement.js'
import { useChargerFilters } from '@/composables/useChargerFilters.js'
import { createStationFromFeature } from '@/utils/chargerUtils.js'

// Reactive state
const selectedStation = ref(null)
const selectedLocation = ref(null)
const autoPlan = ref(true)
const forceExpand = ref(false)

// Composables
const { map, isNorth, bearing, resetNorth, addOrUpdateSource, addOrUpdateLineLayer, initializeMap } = useMapSetup()
const { planRoute, clearExistingRoute } = useRouteManagement()
const { showLow, showMid, showHigh, showVeryHigh, applyPercentileFilter, setupFilterWatcher } = useChargerFilters()

// Event handlers
function handleLocationSelect(selectedLocationData) {
  handleSetAsDestination(selectedLocationData)

  if (map() && selectedLocationData.coordinates) {
    const [lng, lat] = selectedLocationData.coordinates
    map().flyTo({
      center: [lng, lat],
      zoom: 14,
      duration: 2000
    })
  }
}

function handlePlanRoute(routeData) {
  planRoute(routeData, map(), {
    addOrUpdateSource, addOrUpdateLineLayer, onPopupBack: () => {
      selectedStation.value = null
      selectedLocation.value = routeData.destination
      autoPlan.value = false
      forceExpand.value = true
      // Reset forceExpand after a short delay to allow for future triggers
      setTimeout(() => {
        forceExpand.value = false
      }, 100)
    }
  })
}

function handleSetAsDestination(stationLocationData) {
  // Clear selected station and set as location for route planning
  selectedStation.value = null
  selectedLocation.value = stationLocationData
  autoPlan.value = true
}

function closeSideCard() {
  // If we're closing a RouteCard (selectedLocation is set), clear the route from the map
  if (selectedLocation.value && map()) {
    clearExistingRoute(map())
  }

  selectedStation.value = null
  selectedLocation.value = null
  forceExpand.value = false
}

function handleChargerClick(e) {
  const features = e.features || []
  if (!features.length) return

  if (features.length === 1) {
    selectedLocation.value = null
    selectedStation.value = createStationFromFeature(features[0])
    return
  }

  // Multiple chargers - show popup
  const container = document.createElement('div')
  const popupApp = createApp(ChargerPopup, {
    features: features.sort((a, b) => {
      const aPct = a.properties?.percentile || 0
      const bPct = b.properties?.percentile || 0
      return bPct - aPct
    }),
    onSelectCharger: (feature) => {
      selectedLocation.value = null
      selectedStation.value = createStationFromFeature(feature)
      popup.remove()
      popupApp.unmount()
    },
    onClosePopup: () => {
      popup.remove()
      popupApp.unmount()
    }
  })

  popupApp.mount(container)
  const popup = new maplibregl.Popup({ closeButton: false, anchor: 'bottom' })
    .setLngLat(e.lngLat)
    .setDOMContent(container)
    .addTo(map())
}

onMounted(() => {
  const mapInstance = initializeMap()

  mapInstance.on('load', () => {
    applyPercentileFilter(mapInstance)
  })

  mapInstance.on('click', 'chargers-point', handleChargerClick)

  setupFilterWatcher(mapInstance)
})
</script>

<style scoped>
.search-container {
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
}

.map-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.bottom-right-controls {
  position: absolute;
  bottom: 40px;
  right: 1rem;

  display: inline-flex;   /* shrink to fit */
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;

  z-index: 2;
  pointer-events: none;   /* let clicks go through empty space */
}

.bottom-right-controls > * {
  pointer-events: auto;   /* re-enable on the actual buttons/popup */
}
#route-popup-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.map-placeholder {
  width: 100%;
  height: 100%;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}

.slide-enter-to,
.slide-leave-from {
  transform: translateX(0);
}

/* Remove default MapLibre popup padding */
:global(.maplibregl-popup-content) {
  padding: 0 !important;
  border-radius: 12px !important;
  box-shadow: none !important;
}
</style>
