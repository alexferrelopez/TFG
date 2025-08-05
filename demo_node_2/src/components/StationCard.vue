/* StationCard.vue */
<template>
  <div class="station-card">
    <h3 class="auto-fit">Charger ID: adasdasdasd{{ chargingStation.id }}</h3>
    <p><strong>Type:</strong> {{ chargingStation.connectorType || 'unknown' }}</p>
    <p><strong>Max kW:</strong> {{ chargingStation.maxPower || 'n/a' }}</p>
    <p><strong>Status:</strong> {{ chargingStation.status || 'n/a' }}</p>
    <p><strong>Percentile:</strong> {{ chargingStation.percentile || 'n/a' }}</p>
  </div>
</template>

<script setup>
defineProps({
  chargingStation: {
    type: Object,
    required: true,
  },
});
</script>

<style scoped>
.station-card {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  background: white;
  overflow-y: auto;
  z-index: 3;
}

.auto-fit {
  white-space: normal;
  word-break: break-word;
  hyphens: auto;
  text-wrap: balance;
  font-size: clamp(1rem, 4vw, 1.5rem);
  margin: 1rem 0 0.5rem;
}
</style>
