<template>
  <aside class="card-container" :class="{ collapsed }">
    <Button class="close-btn" @click="$emit('close')"></Button>
    <div class="content-area">
      <slot />
    </div>
    <CollapseButton class="toggle-btn" @click="collapsed = !collapsed" />
  </aside>
</template>

<script setup>
import { ref } from 'vue';
import CollapseButton from '@/components/CollapseButton.vue';
import Button from '@/components/Button.vue';

const collapsed = ref(false);
</script>

<style scoped>
.card-container {
  position: absolute;
  width: 450px;
  height: 100%;
  transform: translateX(0);
  transition: transform 0.2s ease;
  z-index: 3;
}

.card-container.collapsed {
  transform: translateX(calc(-100%));
}

.content-area {
  position: relative;
  height: 100%;
  padding: 2.5rem;
  box-sizing: border-box;
  background: white;
  box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3), 0 2px 6px 2px rgba(60, 64, 67, 0.15);
  overflow-y: auto;
  z-index: 3;
}

.toggle-btn {
  position: absolute;
  top: 50%;
  right: -24px;
  transform: translateY(-50%);
  align-self: center;
  justify-self: end;
  z-index: 1;
}

.close-btn {
  position: absolute;
  display: flex;
  justify-self: end;
  align-self: start;
  z-index: 4;
  margin: 20px;
}

@media (max-width: 768px),
(pointer: coarse) {
  .card-container {

    max-width: calc(100% - 24px);
  }
}
</style>
