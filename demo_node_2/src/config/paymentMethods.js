// Payment methods configuration shared across components
export const paymentMethodConfig = [
  { 
    id: 'apps', 
    label: 'Mobile App', 
    icon: '/src/assets/payment-methods/mobile.svg' 
  },
  { 
    id: 'rfid', 
    label: 'RFID', 
    icon: '/src/assets/payment-methods/contactless.svg' 
  },
  { 
    id: 'creditCard', 
    label: 'Credit Card', 
    icon: '/src/assets/payment-methods/credit_card.svg' 
  },
  { 
    id: 'nfc', 
    label: 'NFC', 
    icon: '/src/assets/payment-methods/contactless.svg' 
  },
  { 
    id: 'debitCard', 
    label: 'Debit Card', 
    icon: '/src/assets/payment-methods/credit_card.svg' 
  },
  { 
    id: 'pinpad', 
    label: 'PIN Pad', 
    icon: '/src/assets/payment-methods/credit_card.svg' 
  }
]

// Create a map for quick lookup by payment method ID
export const paymentMethodMap = paymentMethodConfig.reduce((map, method) => {
  map[method.id] = method
  return map
}, {})

// Helper function to get payment method icon URL
export function getPaymentMethodIconUrl(methodId) {
  const method = paymentMethodMap[methodId]
  if (method) {
    return new URL(method.icon.replace('/src/', '@/'), import.meta.url).href
  }
  // Fallback to credit card icon
  return new URL('@/assets/payment-methods/credit_card.svg', import.meta.url).href
}

// Helper function to get payment method display label
export function getPaymentMethodLabel(methodId) {
  return paymentMethodMap[methodId]?.label || methodId
}

// Helper function to process payment methods array with fallback handling
export function processPaymentMethods(methods) {
  if (!methods) return []
  
  // Normalize to array if it's a single string
  const normalizedMethods = Array.isArray(methods) ? methods : [methods]
  
  return normalizedMethods
    .filter(method => method && typeof method === 'string') // Filter out null/undefined/empty values
    .map(method => ({
      type: method,
      label: getPaymentMethodLabel(method),
      icon: paymentMethodMap[method]?.icon || '/src/assets/payment-methods/credit_card.svg'
    }))
}
