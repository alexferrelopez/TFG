<template>
  <div class="nearby-chargers-card">
    <h2>Nearby chargers</h2>
    
    <div class="location-section">
      <h4>Location</h4>
      <SearchBar 
        @select="handleLocationSelect" 
        @clear="handleLocationClear" 
        :key="'nearby-location'"
        placeholder="Search location or use current" 
        :value="currentLocation" 
        :openOnFocus="true">
        <template #dropdown-prepend="{ select }">
          <GeoSuggestionItem :onSelect="select" />
        </template>
      </SearchBar>
    </div>

    <PowerPreferences 
      v-model:preferences="chargerOptions" 
      :showVehicleRange="false" 
      :showMaxPower="false" 
    />

    <ConnectorSelector v-model:selectedConnectors="chargerOptions.connectors" />

    <div class="search-section">
      <button @click="searchNearby" :disabled="isLoading" class="search-btn">
        <span v-if="isLoading">Searching...</span>
        <span v-else>Search nearby chargers</span>
      </button>
    </div>

    <div v-if="searchResults" class="results-section">
      <h4>Results ({{ searchResults.meta.count }} within {{ searchResults.meta.radiusKm }}km)</h4>
      <div v-if="searchResults.chargers.features.length === 0" class="no-results">
        No chargers found matching your criteria.
      </div>
      <div v-else class="charger-list">
        <div v-for="charger in searchResults.chargers.features" :key="charger.properties.id" 
          class="charger-item" @click="selectCharger(charger)">
          <div class="charger-header">
            <div class="charger-name">{{ charger.properties.name }}</div>
            <div class="charger-distance">{{ Math.round(charger.properties.distance * 100) / 100 }}km</div>
          </div>
          <div class="charger-details">
            <div class="power-info">{{ charger.properties.maxPowerKw }}kW max</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import SearchBar from '@/components/ui/SearchBar.vue'
import GeoSuggestionItem from '@/components/ui/GeoSuggestionItem.vue'
import PowerPreferences from '@/components/ui/PowerPreferences.vue'
import ConnectorSelector from '@/components/ui/ConnectorSelector.vue'
import { useNotifications } from '@/composables/useNotifications.js'
import { createStationFromFeature } from '@/utils/chargerUtils.js'

const props = defineProps({
  selectedLocation: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['selectCharger'])

const { showError } = useNotifications()
const isLoading = ref(false)
const searchResults = ref(null)
const currentLocation = ref(props.selectedLocation)

const chargerOptions = ref({
  minPowerKw: 50,
  connectors: ['iec62196T2COMBO', 'iec62196T2']
})

// Watch for changes in charger options to trigger auto-search
watch(chargerOptions, () => {
  if (currentLocation.value?.coordinates) {
    searchNearby()
  }
}, { deep: true })

onMounted(() => {
  const saved = localStorage.getItem('nearby-chargers-preferences')
  if (saved) {
    Object.assign(chargerOptions.value, JSON.parse(saved))
  }
  
  // Set initial location from props
  if (props.selectedLocation) {
    currentLocation.value = props.selectedLocation
    searchNearby()
  }
})

const handleLocationSelect = (location) => {
  currentLocation.value = location
  searchNearby()
}

const handleLocationClear = () => {
  currentLocation.value = null
  searchResults.value = null
}

const searchNearby = async () => {
  if (!currentLocation.value?.coordinates) {
    showError('Location Required', 'Please select a location first.')
    return
  }

  isLoading.value = true
  try {
    const response = await fetch('http://192.168.1.153:3001/nearby-chargers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: currentLocation.value.coordinates,
        connectors: chargerOptions.value.connectors,
        minPowerKw: chargerOptions.value.minPowerKw
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || 'Failed to search nearby chargers')
    }

    const data = await response.json()
    searchResults.value = data
    
    // Save preferences
    localStorage.setItem('nearby-chargers-preferences', JSON.stringify(chargerOptions.value))
  } catch (error) {
    console.error('Nearby chargers search error:', error)
    showError('Search Failed', error.message || 'Unable to search for nearby chargers')
  } finally {
    isLoading.value = false
  }
}

const selectCharger = (chargerFeature) => {
  const station = createStationFromFeature(chargerFeature)
  emit('selectCharger', station)
}
</script>

<style scoped>
.nearby-chargers-card {
  padding: 0;
}

.location-section {
  margin: 1rem 0;
}

.location-section h4 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.location-section :deep(.searchbar-container) {
  max-width: none;
}

.location-section :deep(.search-bar) {
  box-shadow: none;
  border: 1px solid #e2e8f0;
}

.location-section :deep(.search-bar):hover {
  border-color: #a0a9b3;
}

.search-section {
  margin-top: 1.5rem;
}

.search-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.search-btn:hover:not(:disabled) {
  background-color: #2563eb;
}

.search-btn:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.results-section {
  margin-top: 1.5rem;
}

.results-section h4 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
}

.no-results {
  text-align: center;
  color: #6b7280;
  font-style: italic;
  padding: 1rem;
}

.charger-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.charger-item {
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.charger-item:hover {
  border-color: #3b82f6;
  background-color: #f8fafc;
}

.charger-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.charger-name {
  font-weight: 500;
  color: #374151;
}

.charger-distance {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.charger-details {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}
</style>
