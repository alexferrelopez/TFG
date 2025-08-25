<template>
  <header class="head">
    <div class="head-main" @click="$emit('toggle-minimize')">
      <button class="rcard-iconbtn" @click.stop="onBackToPlanner?.()">
        <img src="@/assets/undo.svg" alt="Go back to planning" />
      </button>

      <!-- Clickable title with arrow -->
      <div class="title-toggle">
        <h3 class="title">Trip summary</h3>
        <img src="@/assets/arrow_left.svg" alt="Toggle" class="title-arrow" :class="{ expanded: !isMin }" />
      </div>

      <div class="actions">
        <button class="rcard-iconbtn" @click.stop="openRoute" title="Open in Google Maps">
          <img src="@/assets/open_in_new.svg" alt="Open in Google Maps" />
        </button>
      </div>
    </div>

    <RouteSummaryStats :summary="summary" />
  </header>
</template>

<script setup>
import RouteSummaryStats from './RouteSummaryStats.vue'

const props = defineProps({
  originCoords: { type: Array, required: true },
  destinationCoords: { type: Array, required: true },
  summary: { type: Object, required: true },
  stops: { type: Array, required: true },
  isMin: { type: Boolean, required: true },
  onBackToPlanner: { type: Function, required: true }
})

const emit = defineEmits(['toggle-minimize'])

function openRoute() {
  const origin = [props.originCoords[1], props.originCoords[0]];
  const destination = [props.destinationCoords[1], props.destinationCoords[0]];

  // get waypoints from stops array
  const waypoints = props.stops
    .map(s => `${s.lat},${s.lon}`)
    .join("|");

  let url = "https://www.google.com/maps/dir/?api=1";
  url += `&origin=${origin[0]},${origin[1]}`;
  url += `&destination=${destination[0]},${destination[1]}`;
  if (waypoints) url += `&waypoints=${encodeURIComponent(waypoints)}`;

  window.open(url, "_blank");
}
</script>

<style scoped>
.head {
  padding: 16px;
  border-bottom: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.head-main {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  /* entire header clickable */
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  transition: background-color .15s, box-shadow .15s, border-color .15s;
  -webkit-tap-highlight-color: transparent;
}

.back-btn img {
  width: 12px;
  height: 12px;
  opacity: 0.75;
}

@media (hover: hover) and (pointer: fine) {
  .back-btn:hover {
    background: #f8f9fa;
    border-color: #d1d5db;
    box-shadow:
      inset 2px 2px 4px rgba(0, 0, 0, 0.02),
      inset -1px -1px 2px rgba(255, 255, 255, 0.8);
  }
}

.back-btn:active {
  background: #f0f0f0;
  box-shadow:
    inset 3px 3px 6px rgba(0, 0, 0, 0.1),
    inset -2px -2px 4px rgba(255, 255, 255, 0.7);
  border-color: rgba(0, 0, 0, 0.2);
}

.title-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.title {
  font-size: 17px;
  font-weight: 700;
  margin: 0;
  text-align: center;
}

.title-arrow {
  width: 12px;
  height: 12px;
  transition: transform 0.3s ease;
  transform: rotate(-90deg);
  /* default = pointing down */
}

.title-arrow.expanded {
  transform: rotate(90deg);
  /* expanded = pointing up/left */
}

.actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rcard-iconbtn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color .15s, box-shadow .15s, border-color .15s;
  -webkit-tap-highlight-color: transparent;
}

.rcard-iconbtn img {
  width: 14px;
  height: 14px;
}

@media (hover: hover) and (pointer: fine) {
  .rcard-iconbtn:hover {
    background: #f8f9fa;
    border-color: #d1d5db;
    box-shadow:
      inset 2px 2px 4px rgba(0, 0, 0, 0.02),
      inset -1px -1px 2px rgba(255, 255, 255, 0.8);
  }
}

.rcard-iconbtn:active {
  background: #f0f0f0;
  border-color: rgba(0, 0, 0, 0.2);
  box-shadow:
    inset 3px 3px 6px rgba(0, 0, 0, 0.1),
    inset -2px -2px 4px rgba(255, 255, 255, 0.7);
}
</style>
