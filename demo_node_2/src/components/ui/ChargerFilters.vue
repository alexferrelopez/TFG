<template>
  <div class="filter-controls">
    <div class="filter-header" @click="toggleExpanded">
      <span class="filter-title">Charger Filters</span>
      <img 
        src="@/assets/arrow_left.svg" 
        alt="Toggle" 
        class="filter-toggle"
        :class="{ expanded: isExpanded }"
      />
    </div>
    <transition name="filter-expand">
      <div v-show="isExpanded" class="filter-options">
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
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

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

const isExpanded = ref(false)

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<style scoped>
.filter-controls {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-radius: 14px;
  font-size: 0.9rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: box-shadow 0.3s ease, background-color 0.3s ease;
  overflow: hidden;
  min-width: 200px;
  width: max-content;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  user-select: none;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
}

.filter-header:hover {
  background: rgba(229, 231, 235, 0.3);
}

.filter-title {
  font-weight: 600;
  color: #374151;
}

.filter-toggle {
  transition: transform 0.3s ease;
  margin-left: 12px;
  width: 12px;
  height: 12px;
  transform: rotate(-90deg); /* default = pointing down */
}

.filter-toggle.expanded {
  transform: rotate(90deg); /* expanded = pointing left */
}

.filter-options {
  padding: 0 15px 12px 15px;
}

.filter-options label {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
}

.filter-options label:hover {
  background: rgba(229, 231, 235, 0.2);
}

.filter-options input[type="checkbox"] {
  margin: 0;
  margin-right: 8px;
  transform: scale(1.1);
  cursor: pointer;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}

/* Transition animations */
.filter-expand-enter-active,
.filter-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.filter-expand-enter-from,
.filter-expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.filter-expand-enter-to,
.filter-expand-leave-from {
  max-height: 200px;
  opacity: 1;
}
</style>
