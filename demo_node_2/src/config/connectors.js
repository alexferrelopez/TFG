// Connector configuration shared across components
export const connectorConfig = [
  { 
    id: 'iec62196T2COMBO', 
    name: 'Type 2 CCS', 
    icon: '/src/assets/connectors/iec62196T2COMBO.svg' 
  },
  { 
    id: 'iec62196T2', 
    name: 'Type 2', 
    icon: '/src/assets/connectors/iec62196T2.svg' 
  },
  { 
    id: 'iec62196T1COMBO', 
    name: 'Type 1 CCS', 
    icon: '/src/assets/connectors/iec62196T1COMBO.svg' 
  },
  { 
    id: 'iec62196T1', 
    name: 'Type 1', 
    icon: '/src/assets/connectors/iec62196T1.svg' 
  },
  { 
    id: 'chademo', 
    name: 'CHAdeMO', 
    icon: '/src/assets/connectors/chademo.svg' 
  },
  { 
    id: 'nacs', 
    name: 'NACS', 
    icon: '/src/assets/connectors/nacs.svg' 
  },
  { 
    id: 'iec62196T3A', 
    name: 'Type 3A', 
    icon: '/src/assets/connectors/iec62196T3A.svg' 
  },
  { 
    id: 'iec62196T3C', 
    name: 'Type 3C', 
    icon: '/src/assets/connectors/iec62196T3C.svg' 
  },
  { 
    id: 'domesticF', 
    name: 'Domestic F', 
    icon: '/src/assets/connectors/domesticF.svg' 
  },
  { 
    id: 'iec60309x2three32', 
    name: 'IEC 60309', 
    icon: '/src/assets/connectors/iec60309x2three32.svg' 
  }
]

// Create a map for quick lookup by connector ID
export const connectorMap = connectorConfig.reduce((map, connector) => {
  map[connector.id] = connector
  return map
}, {})

// Helper function to get connector icon URL
export function getConnectorIconUrl(connectorId) {
  const connector = connectorMap[connectorId]
  if (connector) {
    return new URL(connector.icon, import.meta.url).href
  }
  // Fallback to unknown charger icon
  return new URL('@/assets/connectors/unknown_charger.svg', import.meta.url).href
}

// Helper function to get connector display name
export function getConnectorName(connectorId) {
  return connectorMap[connectorId]?.name || connectorId
}
