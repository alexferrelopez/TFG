<template>
  <h2 style="max-width: 90%;">{{ props.chargingStation.name }}</h2>
  <p>{{ props.chargingStation.address || 'n/a' }}, {{ props.chargingStation.town || 'n/a' }}</p>
  <p><strong>Type of site: </strong>
    <span class="type-badge" :class="badgeClass">
      {{ props.chargingStation.typeOfSite }}
    </span>
  </p>
  <p><strong>{{ props.chargingStation.operator || 'n/a' }}</strong></p>

  <!-- Set as Destination Button -->
  <button @click="setAsDestination" class="destination-btn">
    <img src="@/assets/location.svg" alt="Location" width="16" height="16" class="location-icon" />
    Set as Destination
  </button>

  <!-- Operating Hours -->
  <p v-if="props.chargingStation.operatingHours" class="operating-hours">
    <strong>Hours:</strong> {{ props.chargingStation.operatingHours }}
  </p>

  <!-- Accessibility (only show if meaningful) -->
  <p v-if="showAccessibility" class="accessibility">
    <strong>Accessibility:</strong>
    <img v-if="isDisabilityAccessible" class="accessibility-icon" :src="accessibilityIconUrl"
      alt="Disability accessible" title="Disability accessible" @error="onAccessibilityIconError" />
  </p>

  <!-- Payment Methods Section -->
  <div class="payment-section" v-if="paymentMethods.length > 0">
    <h4>Payment methods</h4>
    <div class="payment-methods">
      <div v-for="method in paymentMethods" :key="method.type" class="payment-method">
        <img class="payment-icon" :src="getPaymentMethodIconUrl(method.type)" :alt="method.type" :title="method.label"
          @error="onPaymentIconError" />
        <span class="payment-label">{{ method.label }}</span>
      </div>
    </div>
    <p v-if="paymentMethods.length === 0" class="empty">No payment methods available.</p>
  </div>
  <div class="refill-section">
    <h4>{{ props.chargingStation.energyInfrastructureStation?.refillPoint?.length }} Refill points</h4>

    <RefillPointCard v-for="p in props.chargingStation.energyInfrastructureStation?.refillPoint || []" :key="p.name"
      :point="p" />
    <p v-if="!(props.chargingStation.energyInfrastructureStation?.refillPoint?.length)" class="empty">No refill points
      added.</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import RefillPointCard from '@/components/RefillPointCard.vue'
import { getPaymentMethodIconUrl, processPaymentMethods } from '@/config/paymentMethods.js'

const props = defineProps({
  chargingStation: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['setAsDestination'])

const classMap = {
  'Open Space': 'badge-open-space',
  'On Street': 'badge-on-street',
  'In Building': 'badge-in-building',
  'Other': 'badge-other',
}

const badgeClass = computed(() => classMap[props.chargingStation.typeOfSite] || classMap['Other'])

const showAccessibility = computed(() => {
  const accessibility = props.chargingStation.accessibility
  return accessibility &&
    accessibility.toLowerCase() !== 'unknown' &&
    accessibility.toLowerCase() !== 'none' &&
    accessibility.trim() !== ''
})

const isDisabilityAccessible = computed(() => {
  const accessibility = props.chargingStation.accessibility
  return accessibility && accessibility.toLowerCase() === 'disabilityaccessible'
})

const accessibilityIconUrl = new URL('@/assets/accessible.svg', import.meta.url).href

const paymentMethods = computed(() => {
  const methods = props.chargingStation.energyInfrastructureStation?.authenticationAndIdentificationMethods || []
  return processPaymentMethods(methods)
})

function setAsDestination() {
  if (!props.chargingStation.coordinates) {
    console.error('No coordinates available for this charging station')
    return
  }

  emit('setAsDestination', {
    name: props.chargingStation.name,
    coordinates: props.chargingStation.coordinates,
    properties: {
      name: props.chargingStation.name,
      address: props.chargingStation.address,
      town: props.chargingStation.town,
      operator: props.chargingStation.operator
    }
  })
}

function onPaymentIconError(event) {
  const img = event.currentTarget;
  img.onerror = null;
  // Fallback to credit card icon if the specific icon fails to load
  img.src = new URL('@/assets/payment-methods/credit_card.svg', import.meta.url).href;
}

function onAccessibilityIconError(event) {
  const img = event.currentTarget;
  img.onerror = null;
  // Hide the icon if it fails to load
  img.style.display = 'none';
}
</script>

<style scoped>
.refill-section {
  margin-top: 1rem;
}

.operating-hours {
  margin: 0.5rem 0;
  font-size: 0.875rem;
}

.accessibility {
  margin: 0.5rem 0;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.accessibility-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.payment-section {
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.payment-section h4 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.payment-methods {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.payment-method {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1 1 45%;
  box-sizing: border-box;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  background-color: #f8fafc;
}

.payment-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.payment-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
}

.empty {
  color: #666;
  font-style: italic;
}

.type-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #fff;
  text-transform: none;
}

.badge-open-space {
  background-color: #3b82f6;
}

.badge-on-street {
  background-color: #03a26d;
}

.badge-in-building {
  background-color: #f59e0b;
}

.badge-other {
  background-color: #6b7280;
}

.destination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  margin: 1rem 0;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
  -webkit-tap-highlight-color: transparent;
}

.destination-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
}

.destination-btn:active {
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.destination-btn svg {
  flex-shrink: 0;
}

.destination-btn .location-icon {
  flex-shrink: 0;
  filter: brightness(0) invert(1);
  /* Makes the icon white to match button text */
}
</style>
