<template>
  <transition name="slide">
    <aside v-if="charger" class="charger-card">
      <button class="close-btn" @click="$emit('close')">×</button>
      <h3 class="auto-fit">Charger ID: {{ charger.id }}</h3>
      <p><strong>Type:</strong> {{ charger.connectorType || 'unknown' }}</p>
      <p><strong>Max kW:</strong> {{ charger.maxPower || 'n/a' }}</p>
      <p><strong>Status:</strong> {{ charger.status || 'n/a' }}</p>
      <p><strong>Percentile:</strong> {{ charger.percentile || 'n/a' }}</p>
    </aside>
  </transition>
</template>

<script setup>
defineProps({
  charger: Object
})
</script>

<style scoped>
.charger-card {
  position: absolute;
  top: 0; left: 0;
  padding: 40px;
  width: 30%;
  max-width: 400px;
  height: 100%;
  box-sizing: border-box;
  background: white;
  box-shadow: 2px 0 4px rgba(0,0,0,0.2);
  overflow-y: auto;
  z-index: 1;
}

/* close button in the top right of the card */
.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  border: none;
  background: transparent;
  font-size: 1.5rem;
  cursor: pointer;
}

/* slide-in / slide-out transition */
.slide-enter-active, .slide-leave-active {
  transition: transform 0.1s ease;
}
.slide-enter-from, .slide-leave-to {
  transform: translateX(-100%);
}

.auto-fit {
  white-space: normal;
  word-break: break-word;
  hyphens: auto;
  text-wrap: balance;
  font-size: clamp(1rem, 4vw, 1.5rem);
  margin: 1rem 0 0.5rem;
}
@media (max-width: 768px), (pointer: coarse) {
  .charger-card {
    top: auto;   
    left: 0;
    bottom: 0;
    width: 100%;
    max-width: none;
    height: 40%;
    border-radius: 14px 14px 0 0;
    box-shadow: 0 -2px 4px rgba(0,0,0,0.2);
  }

  .auto-fit {
    font-size: clamp(3rem, 5vw, 3.5rem);
  }

  .close-btn {
    top: 8px;
    right: 8px;
    font-size: 5rem;
  }

  /* slide from bottom instead of from left */
  .slide-enter-from, .slide-leave-to {
    transform: translateY(100%);
  }
}
</style>
