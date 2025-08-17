<template>
  <div class="rcard" :class="{ 'is-min': isMin }">
    <!-- Header / Summary -->
    <header class="rcard-header">
      <div class="rcard-title">Trip summary</div>

      <button class="rcard-minbtn" @click="isMin = !isMin" :aria-label="isMin ? 'Expand' : 'Minimize'">
        <img v-if="!isMin" src="@/assets/minimize.svg" alt="Minimize" class="rcard-minbtn-icon" />
        <img v-else src="@/assets/expand.svg" alt="Expand" class="rcard-minbtn-icon" />
      </button>

      <div class="rcard-stats">
        <div class="rcard-stat">
          <div class="rcard-stat-k">Distance</div>
          <div class="rcard-stat-v">{{ summary.totalDistanceFormatted }}</div>
        </div>
        <div class="rcard-stat">
          <div class="rcard-stat-k">Drive time</div>
          <div class="rcard-stat-v">{{ summary.totalDurationFormatted }}</div>
        </div>
        <div class="rcard-stat">
          <div class="rcard-stat-k">Charging</div>
          <div class="rcard-stat-v">{{ summary.totalChargingTimeFormatted }}</div>
        </div>
        <div class="rcard-stat">
          <div class="rcard-stat-k">Total trip</div>
          <div class="rcard-stat-v">{{ summary.totalTripTimeFormatted }}</div>
        </div>
      </div>
    </header>

    <!-- Body -->
    <div class="rcard-body" :class="{ 'is-collapsed': isMin }">
      <!-- Legs -->
      <section class="rcard-legs" v-if="legs.length">
        <div class="rcard-sec-title">{{ legs.length }} Legs</div>
        <ul class="rcard-leglist">
          <li v-for="leg in legs" :key="leg.legIndex" class="rcard-leg">
            <div class="rcard-leg-dot"></div>
            <div class="rcard-leg-main">
              <div class="rcard-leg-line">
                <span class="rcard-leg-from">{{ leg.from }}</span>
                <span class="rcard-leg-arrow">→</span>
                <span class="rcard-leg-to">{{ leg.to }}</span>
              </div>
              <div class="rcard-leg-meta">
                <span>{{ leg.distanceFormatted }}</span>
                <span>•</span>
                <span>{{ leg.durationFormatted }}</span>
              </div>
            </div>
          </li>
        </ul>
      </section>

      <!-- Stops -->
      <section class="rcard-stops">
        <div class="rcard-sec-title">{{ stops.length }} Charging stops</div>

        <div v-if="!stops.length" class="rcard-empty">No charging stops on this route.</div>

        <div v-else class="rcard-stoplist">
          <article v-for="(s, i) in stops" :key="s.id || i" class="rcard-stop">
            <div class="rcard-stop-row rcard-stop-top">
              <div class="rcard-stop-title">{{ s.name }}</div>
              <div class="rcard-stop-badge">{{ s.estimatedChargingTimeFormatted }}</div>
            </div>

            <div class="rcard-stop-row rcard-stop-sub">
              <div class="rcard-stop-subitem">
                <span>{{ s.town }}</span>
              </div>
              <div class="rcard-stop-subitem">
                <span>{{ s.validConnectors }} x {{ s.maxPowerFormatted }}</span>
              </div>
            </div>

            <div class="rcard-stop-row rcard-stop-meta">
              <div class="rcard-stop-metaitem">
                <span class="rcard-ellipsis">{{ s.operator }}</span>
              </div>
              <div class="rcard-stop-metaitem">
                <span class="rcard-ellipsis">{{ s.address }}</span>
              </div>
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
  legs:    { type: Array,  required: true },
  stops:   { type: Array,  required: true }
})

const isMin = ref(false)
</script>

<style scoped>
/* CARD CONTAINER - positioned at bottom center with animations */
.rcard {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  
  width: 380px;
  max-width: 92vw;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  box-shadow: 0 10px 24px rgba(0,0,0,.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji";
  color: #111827;

  /* Slide up animation on initial appearance */
  animation: slideUp 0.3s ease-out;
}

/* Slide up animation */
@keyframes slideUp {
  from {
    transform: translateX(-50%) translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

/* HEADER */
.rcard-header {
  flex-shrink: 0;
  background: #fff;
  z-index: 1;
  padding: 12px 12px 10px;
  border-bottom: 1px solid #e5e7eb;
}

.rcard-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 8px;
}

.rcard-minbtn {
  position: absolute;
  top: 8px;
  right: 8px;
  inline-size: 28px;
  block-size: 28px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  cursor: pointer;
  line-height: 1;
  font-weight: 700;
  transition: background-color 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rcard-minbtn:hover {
  background: #f3f4f6;
}

.rcard-minbtn-icon {
  width: 12px;
  height: 12px;
  display: block;
}

.rcard-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.rcard-stat {
  background: #f9fafb;
  border: 1px solid #f3f4f6;
  border-radius: 10px;
  padding: 8px;
  text-align: center;
}
.rcard-stat-k { font-size: 11px; color: #6b7280; margin-bottom: 2px; }
.rcard-stat-v { font-size: 13px; font-weight: 700; }

/* BODY (scrolls and animates) */
.rcard-body {
  max-height: 45vh;
  overflow: auto;
  padding: 10px 0 10px;
  transition: max-height 0.25s ease-out, opacity 0.25s ease-out;
  opacity: 1;
}

.rcard-body.is-collapsed {
  max-height: 0;
  opacity: 0;
  padding: 0;
  overflow: hidden;
}

/* SECTIONS / TITLES */
.rcard-sec-title {
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  padding: 0 12px;
  margin: 6px 0;
}

/* LEGS */
.rcard-legs { padding-top: 2px; }
.rcard-leglist { list-style: none; margin: 0; padding: 0 10px 0 18px; }
.rcard-leg { position: relative; padding: 8px 4px 8px 16px; border-left: 2px solid #e5e7eb; }
.rcard-leg-dot { position: absolute; left: -6px; top: 14px; width: 10px; height: 10px; background: #3b82f6; border: 2px solid #fff; border-radius: 50%; box-shadow: 0 0 0 1px #93c5fd; }
.rcard-leg-main { display: flex; flex-direction: column; gap: 2px; }
.rcard-leg-line { font-size: 13px; font-weight: 600; display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
.rcard-leg-arrow { color: #6b7280; }
.rcard-leg-meta { font-size: 12px; color: #6b7280; display: flex; gap: 6px; }

/* STOPS */
.rcard-empty { font-size: 12px; color: #6b7280; padding: 8px 12px 12px; }

.rcard-stoplist {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 8px 8px;
}

.rcard-stop {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 10px;
  background: #fff;
}

.rcard-stop-row { display: flex; align-items: center; justify-content: space-between; }
.rcard-stop-top { gap: 8px; }
.rcard-stop-title { font-size: 13px; font-weight: 700; letter-spacing: -0.01em; }
.rcard-stop-badge { font-size: 11px; font-weight: 700; color: #065f46; background: #ecfdf5; border: 1px solid #d1fae5; padding: 3px 8px; border-radius: 999px; white-space: nowrap; }
.rcard-stop-sub { justify-content: flex-start; gap: 12px; margin-top: 6px; }
.rcard-stop-subitem { font-size: 12px; color: #374151; }
.rcard-stop-meta { justify-content: flex-start; gap: 12px; margin-top: 6px; flex-wrap: wrap; }
.rcard-stop-metaitem { font-size: 12px; color: #6b7280; min-width: 0; }
.rcard-ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 240px; }
</style>