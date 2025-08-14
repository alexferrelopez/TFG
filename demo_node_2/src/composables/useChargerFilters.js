// composables/useChargerFilters.js
import { ref, watch } from 'vue'

export function useChargerFilters() {
  const showLow = ref(true)
  const showMid = ref(true)
  const showHigh = ref(true)
  const showVeryHigh = ref(true)

  function applyPercentileFilter(map) {
    if (!map) return

    const getPct = ['to-number', ['get', 'percentile']]
    const ranges = [
      { show: showLow, min: 0, max: 30 },
      { show: showMid, min: 30, max: 75 },
      { show: showHigh, min: 75, max: 90 },
      { show: showVeryHigh, min: 90, max: Infinity }
    ]

    const filters = ranges
      .filter(range => range.show.value)
      .map(range => range.max === Infinity
        ? ['>=', getPct, range.min]
        : ['all', ['>=', getPct, range.min], ['<', getPct, range.max]]
      )

    const expr = filters.length
      ? ['any', ...filters]
      : ['==', ['literal', 0], ['literal', 1]]

    map.setFilter('chargers-point', expr)
  }

  function setupFilterWatcher(map) {
    watch([showLow, showMid, showHigh, showVeryHigh], () => applyPercentileFilter(map))
  }

  return {
    showLow,
    showMid,
    showHigh,
    showVeryHigh,
    applyPercentileFilter,
    setupFilterWatcher
  }
}
