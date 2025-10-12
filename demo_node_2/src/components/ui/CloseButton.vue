<template>
  <button class="btn" @click="$emit('close')">
    <slot>
      <img src="@/assets/close.svg" alt="Close" class="close-icon" />
    </slot>
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
  -webkit-tap-highlight-color: transparent;
}

.close-icon {
  width: 45%;
  height: 45%;
  object-fit: contain;
  display: block;
  margin: auto;
}

@media (hover: hover) and (pointer: fine) {
  .btn:hover {
    color: #f00;
    background: #f8f9fa;
    box-shadow:
      inset 5px 5px 10px #f5f5f5,
      inset -5px -5px 10px #fff;
  }
}

.btn:active {
  color: #f00;
  background: #f0f0f0;
  box-shadow:
    inset 5px 5px 10px #d9d9d9,
    inset -5px -5px 10px #fff;
}
</style>
