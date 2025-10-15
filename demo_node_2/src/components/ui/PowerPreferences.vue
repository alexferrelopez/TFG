<template>
  <div class="power-preferences">
    <h4>Power preferences</h4>
    <div class="option-row" v-if="showVehicleRange">
      <label>Vehicle range (km)</label>
      <input v-model.number="localPreferences.evRangeKm" @input="emitUpdate" type="number" min="0" class="number-input" />
    </div>
    <div class="option-row" v-if="showMaxPower">
      <label>Max charging power (kW)</label>
      <input v-model.number="localPreferences.evMaxPowerKw" @input="emitUpdate" type="number" min="0" class="number-input" />
    </div>
    <div class="option-row">
      <label>Min charging power (kW)</label>
      <input v-model.number="localPreferences.minPowerKw" @input="emitUpdate" type="number" min="0" class="number-input" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  preferences: {
    type: Object,
    default: () => ({
      evRangeKm: 300,
      evMaxPowerKw: 150,
      minPowerKw: 100
    })
  },
  showVehicleRange: {
    type: Boolean,
    default: true
  },
  showMaxPower: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:preferences'])

const localPreferences = ref({ ...props.preferences })

watch(() => props.preferences, (newPrefs) => {
  localPreferences.value = { ...newPrefs }
}, { deep: true })

const emitUpdate = () => {
  emit('update:preferences', { ...localPreferences.value })
}
</script>

<style scoped>
.power-preferences {
  margin-top: 1rem;
}

h4 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.option-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.number-input {
  width: 80px;
  text-align: right;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.number-input:hover {
  border-color: #a0a9b3;
}

.number-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.number-input::-webkit-outer-spin-button,
.number-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.number-input[type=number] {
  -moz-appearance: textfield;
  appearance: textfield;
}
</style>