<template>
  <div class="route-card">
    <h2>Plan Route</h2>
    <p>Set up your charging route</p>

    <div class="route-points">
      <div class="point-section">
        <h4>
          From
        </h4>
        <input 
          v-model="origin" 
          type="text" 
          placeholder="Enter starting location"
          class="location-input"
        />
      </div>

      <div class="point-section">
        <h4>
          To
        </h4>
        <div class="destination-row">
          <input 
            v-model="destination" 
            type="text" 
            placeholder="Enter destination"
            class="location-input"
          />
          <button @click="swapOriginDestination" class="swap-btn" :disabled="!origin && !destination" title="Swap origin and destination">
            ⇅
          </button>
        </div>
      </div>
    </div>

    <div class="route-options">
      <h4>Route Preferences</h4>
      <div class="option-row">
        <label>Vehicle Range (km)</label>
        <input v-model.number="routeOptions.evRangeKm" type="number" min="50" max="1000" class="number-input" />
      </div>
      <div class="option-row">
        <label>Max Charging Power (kW)</label>
        <input v-model.number="routeOptions.evMaxPowerKw" type="number" min="10" max="500" class="number-input" />
      </div>
      <div class="option-row">
        <label>Min Charging Power (kW)</label>
        <input v-model.number="routeOptions.minPowerKw" type="number" min="10" max="500" class="number-input" />
      </div>
    </div>

    <button @click="planRoute" class="plan-btn" :disabled="!canPlanRoute">
      Plan Route
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  selectedLocation: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['planRoute', 'close'])

const origin = ref('')
const destination = ref('')
const routeOptions = ref({
  evRangeKm: 300,
  evMaxPowerKw: 150,
  minPowerKw: 100,
  connectors: ['iec62196T2COMBO', 'iec62196T2']
})

// Auto-populate destination when a location is selected
watch(() => props.selectedLocation, (newLocation) => {
  if (newLocation?.display_name) {
    destination.value = newLocation.display_name
  }
}, { immediate: true })

const canPlanRoute = computed(() => {
  return origin.value.trim() && destination.value.trim()
})

function swapOriginDestination() {
  const temp = origin.value
  origin.value = destination.value
  destination.value = temp
}

function planRoute() {
  if (!canPlanRoute.value) return
  
  emit('planRoute', {
    origin: origin.value,
    destination: destination.value,
    options: routeOptions.value
  })
}
</script>

<style scoped>
.route-points,
.route-options {
  margin-top: 1rem;
}

.point-section {
  margin-bottom: 1rem;
}

h4 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

input {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

input:focus {
  outline: none;
  border-color: #3b82f6;
}

.location-input {
  width: 100%;
}

.destination-row {
  display: flex;
  gap: 0.5rem;
}

.destination-row .location-input {
  flex: 1;
}

.swap-btn {
  width: 40px;
  height: 40px;
  background-color: #6b7280;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
}

.swap-btn:hover:not(:disabled) {
  background-color: #4b5563;
}

.swap-btn:disabled {
  background-color: #d1d5db;
  cursor: not-allowed;
}

.option-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.option-row .number-input {
  width: 80px;
}

.plan-btn {
  width: 100%;
  padding: 0.75rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 1rem;
}

.plan-btn:hover:not(:disabled) {
  background-color: #2563eb;
}

.plan-btn:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}
</style>
