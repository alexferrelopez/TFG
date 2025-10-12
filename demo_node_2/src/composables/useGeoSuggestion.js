import { ref } from 'vue'
import { Capacitor } from '@capacitor/core'

export function useGeoSuggestion() {
  const status = ref('idle') // idle | loading | ready | error
  const suggestion = ref(null)

  async function ensure() {
    try {
      status.value = 'loading'
      const position = await getCurrentPosition()
      const { latitude, longitude } = position.coords
      const feature = await reverseGeocode(latitude, longitude)
      if (feature) {
        suggestion.value = {
          name: feature.properties.name || 'Current Location',
          coordinates: feature.geometry.coordinates,
          properties: feature.properties
        }
      } else {
        suggestion.value = {
          name: 'Current Location',
          coordinates: [longitude, latitude],
          properties: { name: 'Current Location' }
        }
      }
      status.value = 'ready'
    } catch (e) {
      status.value = 'error'
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
      })
    }
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolocation not supported'))
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      )
    })
  }

  async function reverseGeocode(lat, lon) {
    const res = await fetch(`http://192.168.1.153:3001/reverse?lat=${lat}&lon=${lon}&limit=1&lang=en`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return data.features?.[0] ?? null
  }

  return { status, suggestion, ensure }
}

