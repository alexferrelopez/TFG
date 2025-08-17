<template>
  <div class="rcard" :class="{ min: isMin }">
    <!-- Header / Summary -->
    <header class="head">
      <h3 class="title">Trip summary</h3>

      <button class="rcard-minbtn" @click="isMin = !isMin">
        <img :src="isMin ? '/src/assets/expand.svg' : '/src/assets/minimize.svg'" />
      </button>

      <div class="stats">
        <div class="stat"><small>Distance</small><b>{{ summary.totalDistanceFormatted }}</b></div>
        <div class="stat"><small>Drive time</small><b>{{ summary.totalDurationFormatted }}</b></div>
        <div class="stat"><small>Charging</small><b>{{ summary.totalChargingTimeFormatted }}</b></div>
        <div class="stat"><small>Total trip</small><b>{{ summary.totalTripTimeFormatted }}</b></div>
      </div>
    </header>

    <!-- Body -->
    <div class="body" :class="{ collapsed: isMin }">
      <!-- Legs -->
      <section v-if="legs.length">
        <h4 class="sec">{{ legs.length }} Legs</h4>
        <ul class="legs">
          <li v-for="leg in legs" :key="leg.legIndex" class="leg">
            <div class="legcol">
              <div class="legline">
                <span class="from">{{ leg.from }}</span>
                <span class="arrow">→</span>
                <span class="to">{{ leg.to }}</span>
              </div>
              <div class="meta">
                <span>{{ leg.distanceFormatted }}</span><span>•</span><span>{{ leg.durationFormatted }}</span>
              </div>
            </div>
          </li>
        </ul>
      </section>

      <!-- Stops -->
      <section>
        <h4 class="sec">{{ stops.length }} Charging stops</h4>
        <p v-if="!stops.length" class="empty">No charging stops on this route.</p>

        <div v-else class="stops">
          <article v-for="(s, i) in stops" :key="s.id || i" class="stop">
            <div class="row top">
              <div class="stoptitle">{{ s.name }}</div>
              <span class="badge">{{ s.estimatedChargingTimeFormatted }}</span>
            </div>

            <div class="row sub">
              <span>{{ s.town }}</span>
              <span>{{ s.validConnectors }} x {{ s.maxPowerFormatted }}</span>
            </div>

            <div class="row meta">
              <span class="ellipsis">{{ s.operator }}</span>
              <span class="ellipsis">{{ s.address }}</span>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  summary: { type: Object, required: true },
  legs: { type: Array, required: true },
  stops: { type: Array, required: true }
})

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
  box-shadow: 0 10px 24px rgba(0, 0, 0, .12);
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
  position: relative;
  padding: var(--pad);
  border-bottom: 1px solid var(--line);
}

.title {
  font-size: 17px;
  font-weight: 700;
  margin: 0 0 12px;
}

.rcard-minbtn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: var(--chip-bg);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color .15s;
}

.rcard-minbtn:hover {
  background: #f3f4f6;
}

.rcard-minbtn img {
  width: 12px;
  height: 12px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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
  padding: 10px 0;
  transition: max-height .3s ease, opacity .2s ease;
  scrollbar-gutter: stable both-edges;
  contain: layout paint;
  will-change: max-height, opacity;
}

@supports not (scrollbar-gutter: stable) {
  .body {
    overflow-y: scroll;
  }
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
  padding: 0 var(--pad);
  margin: 6px 0;
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
  font-size: 13px;
}

.sub {
  color: #374151;
}

.meta {
  color: var(--muted);
  flex-wrap: wrap;
  line-height: 1; 
}

.empty {
  font-size: 14px;
  color: var(--muted);
  padding: 8px var(--pad) 12px;
}

.stops {
  display: grid;
  gap: var(--gap);
  padding: 0 8px 8px;
}

.stop {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px;
  background: var(--bg);
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
  border-radius: 999px;
  white-space: nowrap;
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 240px;
}
</style>
