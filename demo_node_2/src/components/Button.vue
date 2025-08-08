<template>
  <button class="btn" @click="$emit('close')">
    <slot>×</slot>
  </button>
</template>

<script setup>
defineEmits(['close'])
</script>

<style scoped>
.btn {
  position: absolute;
  z-index: 4;
  padding: 0;
  max-width: fit-content;
  min-width: 2.5rem;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: none;
  border-radius: 50%;
  font-size: 2rem;
  cursor: pointer;
  transition: box-shadow .2s ease, color .2s ease;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.btn:hover,
.btn:active {
  color: #f00;
}

.btn:hover {
  background: #f8f9fa;
  box-shadow:
    inset 5px 5px 10px #f5f5f5,
    inset -5px -5px 10px #fff;
}

.btn:active {
  background: #f0f0f0;
  box-shadow:
    inset 5px 5px 10px #d9d9d9,
    inset -5px -5px 10px #fff;
}
</style>
