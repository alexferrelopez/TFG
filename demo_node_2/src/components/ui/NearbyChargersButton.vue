<template>
  <button @click="handleClick" :disabled="isLoading" class="nearby-btn" title="Find nearby chargers">
    Nearby Chargers
    <div v-if="isLoading" class="loading-spinner"></div>
  </button>
</template>

<script setup>
import { ref } from 'vue'
import { useNotifications } from '@/composables/useNotifications.js'
import { Capacitor } from '@capacitor/core'

const emit = defineEmits(['nearbyRequest'])
const { showError } = useNotifications()
const isLoading = ref(false)

const handleClick = async () => {
  isLoading.value = true
  try {
    const position = await getCurrentPosition()
    const { latitude, longitude } = position.coords

    const locationData = {
      name: 'Current Location',
      coordinates: [longitude, latitude],
      properties: {
        name: 'Current Location'
      }
    }

    emit('nearbyRequest', locationData)
  } catch (error) {
    showError('Location Access Failed', 'Unable to access your current location.')
  } finally {
    isLoading.value = false
  }
}

async function getCurrentPosition() {
  const isCapacitor = Capacitor.isNativePlatform();

  if (isCapacitor) {
    const { Geolocation } = await import('@capacitor/geolocation');
    await Geolocation.requestPermissions()
    return Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    });
  } else {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error('Geolocation not supported'));
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      });
    });
  }
}
</script>

<style scoped>
.nearby-btn {
  width: 40px;
  height: 40px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  -webkit-tap-highlight-color: transparent;
}

.nearby-btn:hover:not(:disabled) {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px 0 rgba(59, 130, 246, 0.15);
}

.nearby-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.icon {
  width: 20px;
  height: 20px;
}

.nearby-btn:hover:not(:disabled) .icon {
  filter: brightness(0) saturate(100%) invert(37%) sepia(90%) saturate(1018%) hue-rotate(211deg) brightness(97%) contrast(94%);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>