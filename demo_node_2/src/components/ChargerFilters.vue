<template>
  <div class="filter-controls">
    <label>
      <input type="checkbox" :checked="showHigh" @change="$emit('update:showHigh', $event.target.checked)" />
      High power
    </label>
    <label>
      <input type="checkbox" :checked="showMid"  @change="$emit('update:showMid',  $event.target.checked)" />
      Medium power
    </label>
    <label>
      <input type="checkbox" :checked="showLow"  @change="$emit('update:showLow',  $event.target.checked)" />
      Low power
    </label>
  </div>
</template>

<script setup>
defineProps({
  showHigh: Boolean,
  showMid:  Boolean,
  showLow:  Boolean
})
defineEmits([
  'update:showHigh',
  'update:showMid',
  'update:showLow'
])
</script>

<style scoped>
.filter-controls {
  position: absolute;
  bottom: 40px;
  right: 10px;
  background: rgba(255,255,255,0.8);
  padding: 8px;
  border-radius: 4px;
  font-size: 0.9em;
}
.filter-controls label {
  display: block;
  margin: 2px 0;
}
</style>