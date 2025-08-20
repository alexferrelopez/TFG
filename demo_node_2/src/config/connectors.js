// Connector configuration shared across components
import iec62196T2COMBO from '@/assets/connectors/iec62196T2COMBO.svg'
import iec62196T2 from '@/assets/connectors/iec62196T2.svg'
import iec62196T1COMBO from '@/assets/connectors/iec62196T1COMBO.svg'
import iec62196T1 from '@/assets/connectors/iec62196T1.svg'
import chademo from '@/assets/connectors/chademo.svg'
import nacs from '@/assets/connectors/nacs.svg'
import iec62196T3A from '@/assets/connectors/iec62196T3A.svg'
import iec62196T3C from '@/assets/connectors/iec62196T3C.svg'
import domesticF from '@/assets/connectors/domesticF.svg'
import iec60309x2three32 from '@/assets/connectors/iec60309x2three32.svg'
import unknownCharger from '@/assets/connectors/unknown_charger.svg'

// Connector configuration
export const connectorConfig = [
  { id: 'iec62196T2COMBO', name: 'Type 2 CCS', icon: iec62196T2COMBO },
  { id: 'iec62196T2', name: 'Type 2', icon: iec62196T2 },
  { id: 'iec62196T1COMBO', name: 'Type 1 CCS', icon: iec62196T1COMBO },
  { id: 'iec62196T1', name: 'Type 1', icon: iec62196T1 },
  { id: 'chademo', name: 'CHAdeMO', icon: chademo },
  { id: 'nacs', name: 'NACS', icon: nacs },
  { id: 'iec62196T3A', name: 'Type 3A', icon: iec62196T3A },
  { id: 'iec62196T3C', name: 'Type 3C', icon: iec62196T3C },
  { id: 'domesticF', name: 'Domestic F', icon: domesticF },
  { id: 'iec60309x2three32', name: 'IEC 60309', icon: iec60309x2three32 }
]

// Quick lookup
export const connectorMap = connectorConfig.reduce((map, connector) => {
  map[connector.id] = connector
  return map
}, {})

export function getConnectorIconUrl(connectorId) {
  return connectorMap[connectorId]?.icon || unknownCharger
}

export function getConnectorName(connectorId) {
  return connectorMap[connectorId]?.name || connectorId
}
