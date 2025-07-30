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
  
  padding-left: 40px;
  position: absolute;
  top: 0;
  left: 0;
  width: 400px;
  height: 100vh;
  background: white;
  box-shadow: 2px 0 4px rgba(0,0,0,0.2);
  overflow-y: auto;
  z-index: 1;
  border-radius: 0 14px 14px 0;
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
  transition: transform 0.3s ease;
}
.slide-enter-from, .slide-leave-to {
  transform: translateX(-100%);
}

.auto-fit {
  /* allow breaks anywhere, hyphenate long words */
  white-space: normal;
  word-break: break-word;
  hyphens: auto;

  /* balance the lines if supported */
  text-wrap: balance;

  /* clamp font-size between 1rem and 1.5rem,
     scaling relative to the card’s width */
  font-size: clamp(1rem, 4vw, 1.5rem);
  margin: 1rem 0 0.5rem; /* tighten up spacing */
}
</style>
