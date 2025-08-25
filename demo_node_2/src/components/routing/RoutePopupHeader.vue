<template>
  <header class="head">
    <div class="head-main">
      <button class="back-btn" @click="onBackToPlanner?.()">
        <img src="@/assets/undo.svg" alt="Go back to planning" class="icon" />
        <span>Open route</span>
      </button>

      <h3 class="title">Trip summary</h3>

      <div class="actions">
        <button class="rcard-iconbtn open-route-btn" @click="openRoute" title="Open in Google Maps">
          <img src="@/assets/open_in_new.svg" alt="Open in Google Maps" />
        </button>
        <button class="rcard-iconbtn rcard-minbtn" @click="$emit('toggle-minimize')">
          <img :src="isMin ? expandIcon : minimizeIcon" alt="" />
        </button>
      </div>
    </div>

    <RouteSummaryStats :summary="summary" />
  </header>
</template>

<script setup>
import expandIcon from '@/assets/expand.svg'
import minimizeIcon from '@/assets/minimize.svg'
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
}

.back-btn {
  justify-self: start;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 28px;
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

.title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 17px;
  font-weight: 700;
  margin: 0;
  text-align: center;
}

.actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rcard-iconbtn {
  width: 28px;
  height: 28px;
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
  opacity: 0.75;
}

@media (hover: hover) and (pointer: fine) {
  .rcard-iconbtn:hover {
    background: #f8f9fa;
    border-color: #d1d5db;
    box-shadow:
      inset 2px 2px 4px rgba(0,0,0,0.02),
      inset -1px -1px 2px rgba(255,255,255,0.8);
  }
}

.rcard-iconbtn:active {
  background: #f0f0f0;
  border-color: rgba(0,0,0,0.2);
  box-shadow:
    inset 3px 3px 6px rgba(0,0,0,0.1),
    inset -2px -2px 4px rgba(255,255,255,0.7);
}

.icon {
  width: 14px;
  height: 14px;
  vertical-align: middle;
  filter: brightness(0) saturate(100%) invert(15%);
}
</style>
