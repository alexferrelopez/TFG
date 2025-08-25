<template>
  <div class="route-card">
    <h2>Plan route</h2>
    <div class="route-points">
      <div class="search-container">
        <div class="search-fields">
          <div class="search-section">
            <SearchBar @select="(location) => originData = location" @clear="originData = null" :key="'origin'"
              placeholder="Search origin" :value="originData" />
          </div>

          <div class="search-section">
            <SearchBar @select="(location) => destinationData = location" @clear="destinationData = null"
              :key="'destination'" placeholder="Search destination" :value="destinationData" />
          </div>
        </div>

        <button @click="swapOriginDestination(); rotated = !rotated" class="swap-btn" :disabled="!originData && !destinationData"
          title="Swap origin and destination">
          <img src="@/assets/swap_vert.svg" alt="Swap" class="swap-icon" :class="{ rotated }"/>
        </button>
      </div>
    </div>

    <div class="route-options">
      <h4>Route preferences</h4>
      <div class="option-row">
        <label>Vehicle range (km)</label>
        <input v-model.number="routeOptions.evRangeKm" type="number" min="0" class="number-input" />
      </div>
      <div class="option-row">
        <label>Max charging power (kW)</label>
        <input v-model.number="routeOptions.evMaxPowerKw" type="number" min="0" class="number-input" />
      </div>
      <div class="option-row">
        <label>Min charging power (kW)</label>
        <input v-model.number="routeOptions.minPowerKw" type="number" min="0" class="number-input" />
      </div>

      <div class="connector-section">
        <h4>Connector types</h4>
        <div class="connector-grid">
          <button v-for="connector in availableConnectors" :key="connector.id" @click="toggleConnector(connector.id)"
            :class="['connector-btn', { active: routeOptions.connectors.includes(connector.id) }]"
            :title="connector.name">
            <img :src="connector.icon" :alt="connector.name" class="connector-icon" />
            <span class="connector-name">{{ connector.name }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import SearchBar from '@/components/ui/SearchBar.vue'
import { connectorConfig } from '@/config/connectors.js'
import { useNotifications } from '@/composables/useNotifications.js'
import { useRouteContext } from '@/composables/useRouteContext.js'
import { Capacitor } from '@capacitor/core'

const { originData, destinationData } = useRouteContext()
const { showError } = useNotifications()
const rotated = ref(false)

const props = defineProps({
  selectedLocation: {
    type: Object,
    default: null
  },
  autoPlan: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['planRoute'])

const { showError } = useNotifications()
const PREFERENCES_STORAGE_KEY = 'ev-route-preferences'

// Use shared connector configuration
const availableConnectors = ref(connectorConfig)
const autoPlan = ref(props.autoPlan)

const routeOptions = ref({
  evRangeKm: 300,
  evMaxPowerKw: 150,
  minPowerKw: 100,
  connectors: ['iec62196T2COMBO', 'iec62196T2']
})

// Auto-populate destination when a location is selected
watch(() => props.selectedLocation, (newLocation) => {
  if (newLocation) {
    destinationData.value = newLocation
    if (!props.autoPlan) autoPlan.value = false
  }
}, { immediate: true })

// Auto-plan route when both origin and destination are set, or when route options change
watch([originData, destinationData, routeOptions], ([newOrigin, newDestination, newOptions]) => {
  if (newOrigin && newDestination) {
    if (autoPlan.value) {
      emit('planRoute', {
        origin: newOrigin,
        destination: newDestination,
        options: newOptions
      })
    }
    autoPlan.value = true
  }
  localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(routeOptions.value))

}, { deep: true })

// Auto-request location and set origin on component mount
onMounted(() => {
  const saved = localStorage.getItem(PREFERENCES_STORAGE_KEY)
  if (saved) Object.assign(routeOptions.value, JSON.parse(saved))

  // Only auto-request location if no origin is set and geolocation is available
  if (!originData.value) {
    requestCurrentLocation()
  }
})

const requestCurrentLocation = async () => {
  try {
    const position = await getCurrentPosition()
    const { latitude, longitude } = position.coords

    // Use reverse geocoding to get address for current location
    const locationData = await reverseGeocode(latitude, longitude)

    if (locationData) {
      // Transform the Photon response to match SearchBar format
      originData.value = {
        name: locationData.properties.name || 'Current Location',
        coordinates: locationData.geometry.coordinates,
        properties: locationData.properties
      }
    } else {
      // Fallback: create a basic location object with coordinates
      originData.value = {
        name: 'Current Location',
        coordinates: [longitude, latitude],
        properties: {
          name: 'Current Location',
          housenumber: '',
          street: '',
          city: '',
          country: ''
        }
      }
    }
  } catch (error) {
    showError('Location Access Failed', 'Unable to access your current location. Please enter your origin manually.')
  }
}

async function getCurrentPosition() {
  const isCapacitor = Capacitor.isNativePlatform();

  if (isCapacitor) {
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      await Geolocation.requestPermissions()

      return Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      });
    } catch (err) {
      showError('Location Error', 'Failed to get current location')
      throw err;
    }
  } else {
    // Fallback to browser API
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error('Geolocation not supported'));
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  }
}

const reverseGeocode = async (lat, lon) => {
  try {
    const res = await fetch(`http://192.168.1.153:3001/reverse?lat=${lat}&lon=${lon}&limit=1&lang=en`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return data.features?.[0] ?? null
  } catch (e) {
    showError('Location Service Error', 'Unable to determine your address. Using coordinates only.')
    return null
  }
}

const swapOriginDestination = () => {
  const newOrigin = destinationData.value ? { ...destinationData.value } : null
  const newDestination = originData.value ? { ...originData.value } : null

  originData.value = newOrigin
  destinationData.value = newDestination
}

const toggleConnector = (connectorId) => {
  const connectors = routeOptions.value.connectors
  const index = connectors.indexOf(connectorId)

  if (index > -1) {
    connectors.splice(index, 1)
  } else {
    connectors.push(connectorId)
  }
}
</script>

<style scoped>
.route-points,
.route-options {
  margin-top: 1rem;
}

.search-container {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.search-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-section {
  display: flex;
  flex-direction: column;
}

.search-container :deep(.searchbar-container) {
  max-width: none;
}

.search-container :deep(.search-bar) {
  box-shadow: none;
  border: 1px solid #e2e8f0;
}

.search-container :deep(.search-bar):hover {
  border-color: #a0a9b3;
}

h4 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

/* Base input styling for all text inputs */
input {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

input:hover {
  border-color: #a0a9b3;
}

input:focus {
  outline: none;
  border-color: #3b82f6;
}

/* Specific styling for number inputs */
.number-input {
  width: 80px;
  text-align: right;
}

/* Hide spinner buttons for number inputs */
.number-input::-webkit-outer-spin-button,
.number-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* For Firefox */
.number-input[type=number] {
  -moz-appearance: textfield;
  appearance: textfield;
}

/* Swap button styling */
.swap-btn {
  width: 30px;
  height: 30px;
  background: none;
  color: black;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

.swap-icon {
  filter: none;
  transition: transform 0.2s ease;

}
.swap-icon.rotated {
  transform: rotate(180deg);
}

.swap-btn:hover:not(:disabled) {
  opacity: 0.7;
}

.swap-btn:disabled {
  opacity: 0.2;
  cursor: not-allowed;
}

.swap-btn:disabled .swap-icon {
  filter: grayscale(1);
}

/* Layout styling */
.option-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.connector-section {
  margin-top: 1.5rem;
}

.connector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.connector-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 0.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  background: white;
  cursor: pointer;
  transition: all 0.1s ease;
  min-height: 80px;
  -webkit-tap-highlight-color: transparent;
}

@media (hover: hover) and (pointer: fine) {
  .connector-btn:hover {
    border-color: #3b82f6;
  }
}

.connector-btn.active {
  border-color: #3b82f6;
  background-color: #dbeafe;
}

.connector-icon {
  width: 40px;
  height: 40px;
  margin-bottom: 0.25rem;
}

.connector-name {
  font-size: 0.75rem;
  color: #374151;
  text-align: center;
  line-height: 1.2;
}

.connector-btn.active .connector-name {
  color: #1d4ed8;
  font-weight: 500;
}
</style>
