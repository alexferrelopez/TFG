<template>
  <button class="north-button" :disabled="isNorth" @click="$emit('reset')" aria-label="Orient north">
    <img :src="iconSrc" alt="Compass" class="compass-icon" :style="{ transform: `rotate(${-45 - bearing}deg)` }" />
  </button>
</template>

<script setup>
import compassPath from '@/assets/compass.svg'

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
    default: compassPath
  }
})
</script>

<style scoped>
.north-button {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 4rem;
  height: 4rem;
  margin: 5px;
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 2;
  background: white;
  border: none;
  padding: 0;
  cursor: pointer;
  border-radius: 50%;
  transition: opacity 0.2s;
}

.north-button:disabled {
  opacity: 0.5;
  cursor: default;
}

.compass-icon {
  display: block;
  width: 50%;
  height: auto;
}

.north-button:hover {
  box-shadow:
    inset 5px 5px 10px #f5f5f5,
    inset -5px -5px 10px #fff;
}

.north-button:active {
  box-shadow:
    inset 5px 5px 10px #d9d9d9,
    inset -5px -5px 10px #fff;
}
</style>
