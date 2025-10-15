<template>
  <div class="connector-section">
    <h4>Connector types</h4>
    <div class="connector-grid">
      <button v-for="connector in availableConnectors" :key="connector.id" @click="toggleConnector(connector.id)"
        :class="['connector-btn', { active: selectedConnectors.includes(connector.id) }]"
        :title="connector.name">
        <img :src="connector.icon" :alt="connector.name" class="connector-icon" />
        <span class="connector-name">{{ connector.name }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { connectorConfig } from '@/config/connectors.js'

const props = defineProps({
  selectedConnectors: {
    type: Array,
    default: () => ['iec62196T2COMBO', 'iec62196T2']
  }
})

const emit = defineEmits(['update:selectedConnectors'])

const availableConnectors = ref(connectorConfig)

const toggleConnector = (connectorId) => {
  const connectors = [...props.selectedConnectors]
  const index = connectors.indexOf(connectorId)

  if (index > -1) {
    connectors.splice(index, 1)
  } else {
    connectors.push(connectorId)
  }
  
  emit('update:selectedConnectors', connectors)
}
</script>

<style scoped>
.connector-section {
  margin-top: 1.5rem;
}

h4 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.connector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.connector-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 0.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  background: white;
  cursor: pointer;
  transition: all 0.1s ease;
  min-height: 80px;
  -webkit-tap-highlight-color: transparent;
}

@media (hover: hover) and (pointer: fine) {
  .connector-btn:hover {
    border-color: #3b82f6;
  }
}

.connector-btn.active {
  border-color: #3b82f6;
  background-color: #dbeafe;
}

.connector-icon {
  width: 40px;
  height: 40px;
  margin-bottom: 0.25rem;
}

.connector-name {
  font-size: 0.75rem;
  color: #374151;
  text-align: center;
  line-height: 1.2;
}

.connector-btn.active .connector-name {
  color: #1d4ed8;
  font-weight: 500;
}
</style>