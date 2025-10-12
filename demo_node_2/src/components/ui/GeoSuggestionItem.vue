<template>
  <div class="geo-container">
    <div v-if="status === 'ready'" class="autocomplete-item geo-item" @mousedown.prevent="onSelect">
      <img src="@/assets/gps.svg" alt="Current location" class="geo-icon" />
      <div class="geo-text">
        <div class="result-name">Current Location</div>
        <div class="result-details">{{ formatted }}</div>
      </div>
    </div>
    <div v-else-if="status === 'loading'" class="autocomplete-item geo-item">
      <img src="@/assets/gps.svg" alt="Detecting" class="geo-icon spinning" />
      <div class="geo-text">
        <div class="result-name">Detecting current location…</div>
        <div class="result-details">Allow location access</div>
      </div>
    </div>
    <div v-else-if="status === 'error'" class="autocomplete-item geo-item" @mousedown.prevent="retry">
      <img src="@/assets/gps.svg" alt="Retry" class="geo-icon" />
      <div class="geo-text">
        <div class="result-name">Use current location</div>
        <div class="result-details">Click to try again</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useGeoSuggestion } from '@/composables/useGeoSuggestion.js'

const props = defineProps({
  onSelect: {
    type: Function,
    required: true
  }
})

const { status, suggestion, ensure } = useGeoSuggestion()

onMounted(() => ensure())

const formatted = computed(() => {
  const p = suggestion.value?.properties || {}
  const parts = []
  if (p.city) parts.push(p.city)
  if (p.state) parts.push(p.state)
  if (p.country) parts.push(p.country)
  return parts.join(', ')
})

function onSelect() {
  if (suggestion.value) props.onSelect({
    name: suggestion.value.name,
    coordinates: suggestion.value.coordinates,
    properties: suggestion.value.properties
  })
}

function retry() {
  ensure()
}
</script>

<style scoped>
.geo-container { border-bottom: 1px solid #f0f0f0; }
.geo-item { display: flex; align-items: center; gap: 10px; }
.geo-icon { width: 18px; height: 18px; opacity: 0.9; }
.spinning { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>

