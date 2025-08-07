<template>
  <div class="station-card">
    <h2 >{{ props.chargingStation.name }}</h2>
    <p>{{ props.chargingStation.address || 'n/a' }}, {{ props.chargingStation.town || 'n/a' }}</p>
    <p><strong>Type of Site: </strong>
      <span class="type-badge" :class="badgeClass">
        {{ badgeLabel }}
      </span>
    </p>
    <p><strong>{{ props.chargingStation.operator || 'n/a' }}</strong></p>
    <!-- 
     
    <p><strong>Percentile:</strong> {{ props.chargingStation.percentile || 'n/a' }}</p>
    <p><strong>Score:</strong> {{ props.chargingStation.score || 'n/a' }}</p>
    
    -->


     <div class="refill-section">
      <h4>Refill Points</h4>

      <RefillPointCard
        v-for="p in props.chargingStation.energyInfrastructureStation?.refillPoint || []"
        :key="p.name"
        :point="p"
      />
      <p
        v-if="!(props.chargingStation.energyInfrastructureStation?.refillPoint?.length)"
        class="empty"
      >No refill points added.</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import RefillPointCard from '@/components/RefillPointCard.vue'

const props = defineProps({
  chargingStation: {
    type: Object,
    required: true
  }
})

const labelMap = {
  openSpace:   'Open Space',
  onstreet:    'On Street',
  inBuilding:  'In Building',
  other:       'Other'
}

const classMap = {
  openSpace:   'badge-open-space',
  onstreet:    'badge-on-street',
  inBuilding:  'badge-in-building',
  other:       'badge-other'
}

const rawType = computed(() => props.chargingStation.typeOfSite || 'other')
const badgeLabel = computed(() => labelMap[rawType.value] || labelMap.other)
const badgeClass = computed(() => classMap[rawType.value] || classMap.other)
</script>

<style scoped>
.refill-section {
  margin-top: 1rem;
}
.empty {
  color: #666;
  font-style: italic;
}

.type-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #fff;
  text-transform: none;
}

.badge-open-space {
  background-color: #3b82f6;
}

.badge-on-street {
  background-color: #03a26d;
}

.badge-in-building {
  background-color: #f59e0b;
}

.badge-other {
  background-color: #6b7280;
}
</style>
