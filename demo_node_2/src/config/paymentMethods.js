// Import all icons so Vite bundles them
import mobile from '@/assets/payment-methods/mobile.svg'
import contactless from '@/assets/payment-methods/contactless.svg'
import creditCard from '@/assets/payment-methods/credit_card.svg'

// Payment methods configuration
export const paymentMethodConfig = [
  { id: 'apps',       label: 'Mobile App',   icon: mobile },
  { id: 'rfid',       label: 'RFID',         icon: contactless },
  { id: 'creditCard', label: 'Credit Card',  icon: creditCard },
  { id: 'nfc',        label: 'NFC',          icon: contactless },
  { id: 'debitCard',  label: 'Debit Card',   icon: creditCard },
  { id: 'pinpad',     label: 'PIN Pad',      icon: creditCard }
]

// Create a map for quick lookup
export const paymentMethodMap = paymentMethodConfig.reduce((map, method) => {
  map[method.id] = method
  return map
}, {})

// Helper: get icon URL
export function getPaymentMethodIconUrl(methodId) {
  return paymentMethodMap[methodId]?.icon || creditCard
}

// Helper: get label
export function getPaymentMethodLabel(methodId) {
  return paymentMethodMap[methodId]?.label || methodId
}

// Helper: normalize array with fallbacks
export function processPaymentMethods(methods) {
  if (!methods) return []
  const normalized = Array.isArray(methods) ? methods : [methods]

  return normalized
    .filter(m => typeof m === 'string' && m.trim() !== '')
    .map(m => ({
      type: m,
      label: getPaymentMethodLabel(m),
      icon: getPaymentMethodIconUrl(m)
    }))
}
