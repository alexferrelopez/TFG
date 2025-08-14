<template>
  <div class="searchbar-container">
    <div class="search-bar">
      <input ref="searchInput" v-model="searchQuery" type="text" placeholder="Search destination" class="search-input"
        spellcheck="false" @input="handleInput" @focus="showResults = true" @blur="handleBlur"
        @keydown="handleKeydown" />
    </div>

    <div v-if="showResults && searchResults.length > 0" class="autocomplete-dropdown">
      <div v-for="(result, index) in searchResults" :key="index" class="autocomplete-item"
        :class="{ active: selectedIndex === index || (selectedIndex === -1 && index === 0) }"
        @mousedown="selectResult(result)" @mouseenter="selectedIndex = index">
        <div class="result-name">{{ result.properties.name }}</div>
        <div class="result-details">
          {{ formatResultDetails(result.properties) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const emit = defineEmits(['select'])

const searchQuery = ref('')
const searchResults = ref([])
const showResults = ref(false)
const selectedIndex = ref(-1)
const searchInput = ref(null)
let currentAbortController = null

const handleInput = (event) => {
  const query = event.target.value
  searchQuery.value = query

  // Cancel any ongoing request
  if (currentAbortController) {
    currentAbortController.abort()
  }

  // Immediate search with request cancellation
  performSearch(query)
}

const performSearch = async (query) => {
  if (!query) return

  // Create new abort controller for this request
  currentAbortController = new AbortController()
  const signal = currentAbortController.signal

  selectedIndex.value = -1

  try {
    // Call the geocoding endpoint from ev_router with limit parameter
    const response = await fetch(`http://192.168.1.153:3001/geocode?q=${encodeURIComponent(query)}&limit=4`, {
      signal // Pass abort signal to fetch
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Only update results if this request wasn't cancelled
    if (!signal.aborted) {
      searchResults.value = data.features || []
      showResults.value = true
    }

  } catch (error) {
    // Don't log errors for aborted requests (normal behavior)
    if (error.name !== 'AbortError') {
      console.error('Geocoding search failed:', error)
      searchResults.value = []
    }
  }
}

const handleBlur = () => {
  // Delay hiding results to allow for click events
  setTimeout(() => {
    showResults.value = false
  }, 150)
}

const handleKeydown = (event) => {
  switch (event.key) {
    case 'ArrowDown':
      if (showResults.value && searchResults.value.length > 0) {
        event.preventDefault()
        // First press goes to index 1 (second item), since index 0 is "selected by default"
        if (selectedIndex.value === -1) {
          selectedIndex.value = searchResults.value.length > 1 ? 1 : 0
        } else {
          selectedIndex.value = Math.min(selectedIndex.value + 1, searchResults.value.length - 1)
        }
      }
      break
    case 'ArrowUp':
      if (showResults.value && searchResults.value.length > 0) {
        event.preventDefault()
        // Going up from second item (index 1) should go to "no selection" (first item default)
        if (selectedIndex.value <= 1) {
          selectedIndex.value = -1
        } else {
          selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
        }
      }
      break
    case 'Enter':
      event.preventDefault()
      if (showResults.value && searchResults.value.length > 0) {
        // If something is highlighted, select it; otherwise select the first result
        const indexToSelect = selectedIndex.value >= 0 ? selectedIndex.value : 0
        selectResult(searchResults.value[indexToSelect])
      }
      break
    case 'Escape':
      showResults.value = false
      searchInput.value?.blur()
      break
  }
}

const selectResult = (result) => {
  searchQuery.value = result.properties.name || ''
  showResults.value = false
  selectedIndex.value = -1

  // Emit the selected result to parent component
  emit('select', {
    name: result.properties.name,
    coordinates: result.geometry.coordinates, // [lng, lat]
    properties: result.properties
  })

  searchInput.value?.blur()
}

const formatResultDetails = (properties) => {
  const parts = []

  if (properties.city) parts.push(properties.city)
  if (properties.state) parts.push(properties.state)
  if (properties.country) parts.push(properties.country)

  return parts.join(', ')
}
</script>

<style scoped>
.searchbar-container {
  position: relative;
  max-width: 300px;
  width: 100%;
}

.search-bar {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3), 0 2px 6px 2px rgba(60, 64, 67, 0.15);
  overflow: hidden;
  width: 100%;
  min-width: 120px;
}

.search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  padding: 12px 16px;
  font-size: 16px;
  font-family: inherit;
  background: transparent;
  color: #333;
}

.search-input::placeholder {
  color: #999;
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3), 0 2px 6px 2px rgba(60, 64, 67, 0.15);
  z-index: 1000;
  margin-top: 4px;
}

.autocomplete-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.autocomplete-item:first-child {
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.autocomplete-item:last-child {
  border-bottom: none;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}

.autocomplete-item:hover,
.autocomplete-item.active {
  background-color: #f8f9fa;
}

/* Ensure first item respects container border radius when active */
.autocomplete-item:first-child.active {
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

/* Ensure last item respects container border radius when active */
.autocomplete-item:last-child.active {
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}

.result-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.result-details {
  font-size: 14px;
  color: #666;
}
</style>