<template>
    <aside class="card-container" :class="{ collapsed }">
      <aside class="charger-card">
        <button class="close-btn" @click="$emit('close')">×</button>

        <h3 class="auto-fit">Charger ID: {{ charger.id }}</h3>
        <p><strong>Type:</strong> {{ charger.connectorType || 'unknown' }}</p>
        <p><strong>Max kW:</strong> {{ charger.maxPower || 'n/a' }}</p>
        <p><strong>Status:</strong> {{ charger.status || 'n/a' }}</p>
        <p><strong>Percentile:</strong> {{ charger.percentile || 'n/a' }}</p>
      </aside>
      <CollapseButton class="toggle-btn" @click="collapsed = !collapsed" />
    </aside>
</template>

<script setup>
import { ref } from 'vue';
import CollapseButton from './CollapseButton.vue';

defineProps({ charger: Object });
const collapsed = ref(false);

</script>

<style scoped>
.card-container {
  position: absolute;
  width: 30%;
  max-width: 400px;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr auto;
  overflow: hidden;  
  transform: translateX(0);
  transition: transform 0.2s ease;
  z-index: 3;
}

.card-container.collapsed {
  transform: translateX(
    calc(-100% + 24px)
  );
}

.charger-card {
  grid-column: 1;
  position: relative;   
  padding: 40px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  background: white;
  box-shadow: 0 1px 2px rgba(60,64,67,0.3), 0 2px 6px 2px rgba(60,64,67,0.15);
  overflow-y: auto;
  z-index: 3;
}

.toggle-btn {
  grid-column: 2;
  align-self: center;
  justify-self: end;
  position: relative;
  z-index: 2;
}

.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  border: none;
  background: transparent;
  font-size: 2rem;
  cursor: pointer;
}
.close-btn:hover {
  color: #ff0000;
}

.auto-fit {
  white-space: normal;
  word-break: break-word;
  hyphens: auto;
  text-wrap: balance;
  font-size: clamp(1rem, 4vw, 1.5rem);
  margin: 1rem 0 0.5rem;
}

/*
@media (max-width: 768px), (pointer: coarse) {
  .charger-card {
    top: auto;
    left: 0;
    bottom: 0;
    width: 100%;
    max-width: none;
    height: 40%;
    border-radius: 4rem 4rem 0 0;
    box-shadow: 0 -2px 4px rgba(0,0,0,0.2);
  }

  .auto-fit {
    font-size: clamp(3rem, 5vw, 3.5rem);
  }

  .close-btn {
    position: absolute;
    top: 2rem;
    right: 2rem;
    font-size: 5rem;
    background: transparent;
  }

  .slide-enter-from,
  .slide-leave-to {
    transform: translateY(100%);
  }
}
  */
</style>
