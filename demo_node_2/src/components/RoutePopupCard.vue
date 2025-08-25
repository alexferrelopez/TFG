<template>
  <div class="rcard" :class="{ min: isMin }">
    <!-- Header / Summary -->
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
          <button class="rcard-iconbtn rcard-minbtn" @click="isMin = !isMin">
            <img :src="isMin ? expandIcon : minimizeIcon" alt="" />
          </button>
        </div>
      </div>

      <div class="stats">
        <div class="stat"><small>Distance</small><b>{{ summary.totalDistanceFormatted }}</b></div>
        <div class="stat"><small>Drive time</small><b>{{ summary.totalDurationFormatted }}</b></div>
        <div v-if="summary.totalChargingTime > 0" class="stat">
          <small>Charging</small>
          <b>{{ summary.totalChargingTimeFormatted }}</b>
        </div>
        <div class="stat"><small>Total trip</small><b>{{ summary.totalTripTimeFormatted }}</b></div>
      </div>
    </header>

    <!-- Body -->
    <div class="body" :class="{ collapsed: isMin }">
      <!-- Legs -->
      <section v-if="legs.length">
        <h4 class="sec" v-if="legs.length > 1">{{ legs.length }} Legs</h4>
        <h4 class="sec" v-else>{{ legs.length }} Leg</h4>
        <ul class="legs">
          <li v-for="leg in legs" :key="leg.legIndex" class="leg">
            <div class="legcol">
              <div class="legline">
                <span class="from">{{ leg.from }}</span>
                <span class="arrow">→</span>
                <span class="to">{{ leg.to }}</span>
              </div>
              <div class="meta">
                <span>{{ leg.distanceFormatted }}</span><span> • </span><span>{{ leg.durationFormatted }}</span>
              </div>
            </div>
          </li>
        </ul>
      </section>

      <!-- Stops -->
      <section>
        <template v-if="stops.length">
          <h4 class="sec">{{ stops.length }} Charging {{ stops.length === 1 ? 'stop' : 'stops' }}</h4>
          <div class="stops">
            <article v-for="(s, i) in stops" :key="s.id || i" class="stop" @click="zoomToStop(s)">
              <div class="row top">
                <div class="stoptitle">{{ s.name }}</div>
                <span class="badge">{{ s.estimatedChargingTimeFormatted }}</span>
              </div>

              <div class="row sub">
                <span>{{ s.town }}</span>
                <b>{{ s.validConnectors }} x {{ s.maxPowerFormatted }}</b>
              </div>

              <div class="row meta">
                <span class="ellipsis">{{ s.operator }}</span>
                <span class="ellipsis">
                  <img src="@/assets/location.svg" alt="" class="icon" />
                  {{ s.address }}
                </span>
              </div>
            </article>
          </div>
        </template>
        <p v-else class="empty">No charging stops on this route.</p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import expandIcon from '@/assets/expand.svg'
import minimizeIcon from '@/assets/minimize.svg'

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

  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  width: 380px;
  max-width: 92vw;
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
}

@keyframes slideUp {
  from {
    transform: translateX(-50%) translateY(100%);
    opacity: 0;
  }
}

.head {
  padding: 16px;
  border-bottom: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.title {
  font-size: 17px;
  font-weight: 700;
  margin: 0 0 12px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 8px;
}

.stat {
  background: var(--chip-bg);
  border: 1px solid var(--chip-br);
  border-radius: 10px;
  padding: 8px;
  text-align: center;
}

.stat small {
  display: block;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 2px;
}

.stat b {
  font-size: 14px;
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

.sec {
  font-size: 14px;
  font-weight: 700;
  color: #374151;
  margin: 8px 0;
}

.legs {
  list-style: none;
  margin: 0;
  padding: 0 10px 0 18px;
}

.leg {
  position: relative;
  padding: 8px 4px 8px 16px;
  border-left: 2px solid var(--line);
}

.leg::before {
  content: "";
  position: absolute;
  left: -8px;
  top: 12px;
  width: 10px;
  height: 10px;
  background: var(--accent);
  border: 2px solid var(--bg);
  border-radius: 50%;
  box-shadow: 0 0 0 1px var(--accent-ring);
}

.legcol {
  display: grid;
  gap: 2px;
}

.legline {
  font-size: 14px;
  font-weight: 600;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: baseline;
}

.arrow {
  color: var(--muted);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.sub,
.meta {
  justify-content: flex-start;
  gap: 12px;
  margin-top: 6px;
  font-size: 14px;
}

.sub {
  color: #374151;
}

.meta {
  color: var(--muted);
  flex-wrap: wrap;
  row-gap: 4px;
}

.empty {
  font-size: 14px;
  color: var(--muted);
  padding: 8px var(--pad) 12px;
  margin: 0;
}

.stops {
  margin: 0 8px;
  display: grid;
  gap: var(--gap);
  padding: 0 8px 8px;
}

.stop {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  padding: 10px;
  background: var(--bg);
  transition: background-color .2s;
  cursor: pointer;
  transition: box-shadow .2s ease, color .2s ease;
  -webkit-tap-highlight-color: transparent;
}

@media (hover: hover) and (pointer: fine) {
  .stop:hover {
    background: #f8f9fa;
    box-shadow:
      inset 2px 2px 4px rgba(0, 0, 0, 0.1),
      inset -1px -1px 2px rgba(255, 255, 255, 0.8);
    border-color: rgba(0, 0, 0, 0.15);
  }
}

.stop:active {
  background: #f0f0f0;
  transform: none;
  box-shadow:
    inset 3px 3px 6px rgba(0, 0, 0, 0.15),
    inset -2px -2px 4px rgba(255, 255, 255, 0.7);
  border-color: rgba(0, 0, 0, 0.2);
}


.top .stoptitle {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -.01em;
}

.badge {
  font-size: 12px;
  font-weight: 700;
  color: var(--ok-fg);
  background: var(--ok-bg);
  border: 1px solid var(--ok-br);
  padding: 3px 8px;
  border-radius: 50px;
  white-space: nowrap;
}

.icon {
  width: 14px;
  height: 14px;
  vertical-align: middle;
  filter: brightness(0) saturate(100%) invert(15%);
}

.ellipsis {
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 240px;
}

.head-main {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* buttons on sides */
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

/* Title always centered */
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
  gap: 6px; /* space between open and minimize */
}

/* Shared styles for round icon buttons */
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

/* Reuse the same hover/active styles */
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
</style>
