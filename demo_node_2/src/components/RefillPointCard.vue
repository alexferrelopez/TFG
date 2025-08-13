<template>
  <div class="refill-point-card">
    <h4 class="name">{{ point.name }}</h4>
    <div class="connector-groups">
      <div v-for="(grp, i) in groupedConnectors" :key="i" class="connector-group">
        <img class="icon" :src="getIconUrl(grp.type)" :alt="grp.type" :title="grp.type" @error="onIconError" />
        <span v-if="grp.count > 1" class="count">x{{ grp.count }}</span>
        <span class="power">{{ formatPower(grp.power) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, toRefs } from 'vue'

const props = defineProps({ point: { type: Object, required: true } })
const { point } = toRefs(props)

const groupedConnectors = computed(() => {
  const map = {}
  for (const { connectorType, maxPowerAtSocket } of point.value.connectors || []) {
    const kw = Math.round((Number(maxPowerAtSocket) / 1000) * 10) / 10
    const key = `${connectorType}::${kw}`
    map[key] ??= { type: connectorType, power: kw, count: 0 }
    map[key].count++
  }
  return Object.values(map)
})

function formatPower(kW) {
  return `${kW % 1 === 0 ? kW.toFixed(0) : kW.toFixed(1)} kW`
}

const unknownIconUrl = new URL('../assets/unknown_charger.svg', import.meta.url).href

function getIconUrl(type) {
  return new URL(`../assets/${type}.svg`, import.meta.url).href
}

function onIconError(event) {
  const img = event.currentTarget;
  img.onerror = null;
  img.src = unknownIconUrl;
}
</script>

<style scoped>
.refill-point-card {
  border: 1px solid #ddd;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 0.5rem;
}

.name {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.connector-groups {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.connector-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1 1 45%;
  box-sizing: border-box;
}

.count {
  font-weight: bold;
}

.icon {
  width: 48px;
  height: 48px;
}

.power {

  font-size: 1rem;
}
</style>
