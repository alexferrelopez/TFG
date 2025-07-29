<template>
  <button
    class="north-button"
    :disabled="isNorth"
    @click="$emit('reset')"
    aria-label="Orient north"
  >
    <img
      :src="iconSrc"
      alt="Compass"
      class="compass-icon"
      :style="{ transform: `rotate(${-45-bearing}deg)` }"
    />
  </button>
</template>

<script setup>

const props = defineProps({
  bearing: {
    type: Number,
    required: true
  },
  isNorth: {
    type: Boolean,
    required: true
  },
  iconSrc: {
    type: String,
    default: '/compass.svg'
  }
})
</script>

<style scoped>
.north-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 2;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: opacity 0.2s;
}
.north-button:disabled {
  opacity: 0.5;
  cursor: default;
}
.compass-icon {
  width: 2.5rem;
  height: 2.5rem;
  display: block;
  transform-origin: center center;
}
</style>
