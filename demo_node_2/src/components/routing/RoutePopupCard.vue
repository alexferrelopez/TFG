<template>
  <div class="rcard" :class="{ min: isMin }">
    <RoutePopupHeader 
      :origin-coords="originCoords"
      :destination-coords="destinationCoords"
      :summary="summary"
      :stops="stops"
      :is-min="isMin"
      :on-back-to-planner="onBackToPlanner"
      @toggle-minimize="isMin = !isMin"
    />

    <!-- Body -->
    <div class="body" :class="{ collapsed: isMin }">
      <RouteLegsList :legs="legs" />
      <ChargingStopsList :stops="stops" @stop-click="zoomToStop" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import RoutePopupHeader from './RoutePopupHeader.vue'
import RouteLegsList from './RouteLegsList.vue'
import ChargingStopsList from './ChargingStopsList.vue'

const props = defineProps({
  originCoords: { type: Array, required: true },
  destinationCoords: { type: Array, required: true },
  summary: { type: Object, required: true },
  legs: { type: Array, required: true },
  stops: { type: Array, required: true },
  map: { type: Object, required: true },
  onBackToPlanner: { type: Function, required: true }
})

function zoomToStop(stop) {
  if (!props.map || !stop.lon || !stop.lat) return
  props.map.flyTo({
    center: [stop.lon, stop.lat],
    zoom: 16,
    speed: 1.2,
    curve: 1.42,
    essential: true
  })
}

const isMin = ref(false)
</script>

<style scoped>
.rcard {
  --bg: #fff;
  --fg: #111827;
  --muted: #6b7280;
  --line: #e5e7eb;
  --chip-bg: #f9fafb;
  --chip-br: #f3f4f6;
  --ok-fg: #065f46;
  --ok-bg: #ecfdf5;
  --ok-br: #d1fae5;
  --radius: 14px;
  --pad: 12px;
  --gap: 8px;
  --accent: #3b82f6;
  --accent-ring: #93c5fd;

  position: relative;
  z-index: 2;
  width: 380px;
  max-width: calc(100vw - 2rem);
  background: var(--bg);
  color: var(--fg);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3), 0 2px 6px 2px rgba(60, 64, 67, 0.15);
  overflow: hidden;
  animation: slideUp .3s ease-out;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 0.5rem;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
}

.body {
  max-height: 35vh;
  overflow-y: auto;
  padding: 16px;
  transition: max-height .3s ease, opacity .2s ease;
  contain: layout paint;
  will-change: max-height, opacity;
}

.body.collapsed {
  max-height: 0;
  opacity: 0;
  padding: 0;
  overflow: hidden;
}
</style>
