<template>
  <div class="route-card">
    <h2>Plan route</h2>
    <div class="route-points">
      <div class="search-container">
        <div class="search-fields">
          <div class="search-section">
            <SearchBar @select="(location) => originData = location" @clear="originData = null" :key="'origin'"
              placeholder="Search origin" :value="originData" :openOnFocus="true">
              <template #dropdown-prepend="{ select }">
                <GeoSuggestionItem :onSelect="select" />
              </template>
            </SearchBar>
          </div>

          <div class="search-section">
            <SearchBar @select="(location) => destinationData = location" @clear="destinationData = null"
              :key="'destination'" placeholder="Search destination" :value="destinationData" :openOnFocus="true">
              <template #dropdown-prepend="{ select }">
                <GeoSuggestionItem :onSelect="select" />
              </template>
            </SearchBar>
          </div>
        </div>

        <div class="actions">
          <button @click="swapOriginDestination(); rotated = !rotated" class="icon-btn" :disabled="!originData && !destinationData"
            title="Swap origin and destination" aria-label="Swap origin and destination">
            <img src="@/assets/swap_vert.svg" alt="Swap" class="icon" :class="{ rotated }"/>
          </button>
        </div>
      </div>
    </div>

    <div class="route-options">
      <h4>Route preferences</h4>
      <PowerPreferences 
        v-model:preferences="routeOptions" 
        :showVehicleRange="true" 
        :showMaxPower="true" 
      />

      <ConnectorSelector v-model:selectedConnectors="routeOptions.connectors" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import SearchBar from '@/components/ui/SearchBar.vue'
import GeoSuggestionItem from '@/components/ui/GeoSuggestionItem.vue'
import PowerPreferences from '@/components/ui/PowerPreferences.vue'
import ConnectorSelector from '@/components/ui/ConnectorSelector.vue'
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
const PREFERENCES_STORAGE_KEY = 'ev-route-preferences'

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
})

const swapOriginDestination = () => {
  const newOrigin = destinationData.value ? { ...destinationData.value } : null
  const newDestination = originData.value ? { ...originData.value } : null

  originData.value = newOrigin
  destinationData.value = newDestination
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

.actions {
  display: flex;
  gap: 0.25rem;
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

/* (unused) reserved for future in-bar icons */

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
.icon-btn {
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

.icon {
  width: 24px;
  height: 24px;
  filter: none;
  transition: transform 0.2s ease;
}

.icon.rotated {
  transform: rotate(180deg);
}

.icon-btn:hover:not(:disabled) {
  opacity: 0.7;
}

.icon-btn:disabled {
  opacity: 0.2;
  cursor: not-allowed;
}

.icon-btn:disabled .icon {
  filter: grayscale(1);
}
</style>
