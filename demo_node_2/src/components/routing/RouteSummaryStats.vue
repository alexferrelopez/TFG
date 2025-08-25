<template>
  <div class="stats">
    <div class="stat">
      <small>Distance</small>
      <b>{{ summary.totalDistanceFormatted }}</b>
    </div>
    <div class="stat">
      <small>Drive time</small>
      <b>{{ summary.totalDurationFormatted }}</b>
    </div>
    <div v-if="summary.totalChargingTime > 0" class="stat">
      <small>Charging</small>
      <b>{{ summary.totalChargingTimeFormatted }}</b>
    </div>
    <div class="stat">
      <small>Total trip</small>
      <b>{{ summary.totalTripTimeFormatted }}</b>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  summary: { type: Object, required: true }
})
</script>

<style scoped>
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
</style>
