<template>
  <div class="filter-controls">
    <label>
      <input type="checkbox" :checked="showVeryHigh" @change="$emit('update:showVeryHigh', $event.target.checked)" />
      <span>Very high power</span>
    </label>
    <label>
      <input type="checkbox" :checked="showHigh" @change="$emit('update:showHigh', $event.target.checked)" />
      <span>High power</span>
    </label>
    <label>
      <input type="checkbox" :checked="showMid" @change="$emit('update:showMid', $event.target.checked)" />
      <span>Medium power</span>
    </label>
    <label>
      <input type="checkbox" :checked="showLow" @change="$emit('update:showLow', $event.target.checked)" />
      <span>Low power</span>
    </label>
  </div>
</template>

<script setup>
defineProps({
  showHigh: Boolean,
  showMid: Boolean,
  showLow: Boolean,
  showVeryHigh: Boolean
})
defineEmits([
  'update:showHigh',
  'update:showMid',
  'update:showLow',
  'update:showVeryHigh'
])
</script>

<style scoped>
.filter-controls {
  position: absolute;
  bottom: 40px;
  right: 10px;
  background: rgba(248, 250, 252, 0.9);
  backdrop-filter: blur(8px);
  padding: 10px;
  border-radius: 12px;
  font-size: 0.9rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.filter-controls label {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
  font-weight: 500;
  color: #374151;
}

.filter-controls input[type="checkbox"] {
  margin-right: 8px;
  transform: scale(1.1);
  cursor: pointer;
}

</style>