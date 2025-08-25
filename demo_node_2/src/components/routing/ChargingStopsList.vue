<template>
  <section>
    <template v-if="stops.length">
      <h4 class="sec">{{ stops.length }} Charging {{ stops.length === 1 ? 'stop' : 'stops' }}</h4>
      <div class="stops">
        <ChargingStopCard 
          v-for="(stop, i) in stops" 
          :key="stop.id || i" 
          :stop="stop"
          @click="$emit('stop-click', stop)"
        />
      </div>
    </template>
    <p v-else class="empty">No charging stops on this route.</p>
  </section>
</template>

<script setup>
import { defineEmits } from 'vue'
import ChargingStopCard from './ChargingStopCard.vue'

const props = defineProps({
  stops: { type: Array, required: true }
})

const emit = defineEmits(['stop-click'])
</script>

<style scoped>
.sec {
  font-size: 14px;
  font-weight: 700;
  color: #374151;
  margin: 8px 0;
}

.stops {
  margin: 0 8px;
  display: grid;
  gap: var(--gap);
  padding: 0 8px 8px;
}

.empty {
  font-size: 14px;
  color: var(--muted);
  padding: 8px var(--pad) 12px;
  margin: 0;
}
</style>
