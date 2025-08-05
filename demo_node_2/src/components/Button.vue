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
  margin: 2rem;
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
}

.btn:hover,
.btn:active {
  color: #f00;
}
.btn:hover {
  box-shadow:
    inset 5px 5px 10px #f5f5f5,
    inset -5px -5px 10px #fff;
}
.btn:active {
  box-shadow:
    inset 5px 5px 10px #d9d9d9,
    inset -5px -5px 10px #fff;
}
</style>
