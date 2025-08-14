<template>
  <div class="searchbar-container">
    <div class="search-bar">
      <input 
        ref="searchInput"
        v-model="searchQuery"
        type="text" 
        placeholder="Search destination" 
        class="search-input"
        spellcheck="false"
        @input="handleInput"
        @focus="showResults = true"
        @blur="handleBlur"
        @keydown="handleKeydown"
      />
      <button class="search-btn" type="button" @click="handleSearch">
        <div class="search-icon"></div>
      </button>
    </div>
    
    <div v-if="showResults && searchResults.length > 0" class="autocomplete-dropdown">
      <div 
        v-for="(result, index) in searchResults" 
        :key="index"
        class="autocomplete-item"
        :class="{ active: selectedIndex === index }"
        @mousedown="selectResult(result)"
        @mouseenter="selectedIndex = index"
      >
        <div class="result-name">{{ result.properties.name }}</div>
        <div class="result-details">
          {{ formatResultDetails(result.properties) }}
        </div>
      </div>
    </div>
    
    <div v-if="showResults && isLoading" class="autocomplete-dropdown">
      <div class="autocomplete-item loading">
        Searching...
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const emit = defineEmits(['search', 'select'])

const searchQuery = ref('')
const searchResults = ref([])
const showResults = ref(false)
const isLoading = ref(false)
const selectedIndex = ref(-1)
const searchInput = ref(null)
let searchTimeout = null

const handleInput = (event) => {
  const query = event.target.value
  searchQuery.value = query
  
  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  if (query.trim().length < 2) {
    searchResults.value = []
    showResults.value = false
    return
  }
  
  // Debounce search requests
  searchTimeout = setTimeout(() => {
    performSearch(query)
  }, 300)
  
  emit('search', query)
}

const performSearch = async (query) => {
  if (!query || query.length < 2) return
  
  isLoading.value = true
  selectedIndex.value = -1
  
  try {
    // Call the geocoding endpoint from ev_router
    const response = await fetch(`http://192.168.1.153:3001/geocode?q=${encodeURIComponent(query)}`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Photon returns results in features array
    searchResults.value = data.features || []
    showResults.value = true
    
  } catch (error) {
    console.error('Geocoding search failed:', error)
    searchResults.value = []
  } finally {
    isLoading.value = false
  }
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    performSearch(searchQuery.value.trim())
  }
}

const handleBlur = () => {
  // Delay hiding results to allow for click events
  setTimeout(() => {
    showResults.value = false
  }, 150)
}

const handleKeydown = (event) => {
  if (!showResults.value || searchResults.value.length === 0) return
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, searchResults.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
      break
    case 'Enter':
      event.preventDefault()
      if (selectedIndex.value >= 0) {
        selectResult(searchResults.value[selectedIndex.value])
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
  max-width: 250px;
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
  min-width: 120px; /* Ensures minimum size to keep button visible */
}

.search-input {
  flex: 1;
  min-width: 0; /* Allows input to shrink below its content size */
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

.search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0; /* Prevents button from shrinking */
  width: 44px; /* Fixed width for consistent button size */
  height: 44px; /* Fixed height for consistent button size */
}

.search-icon {
  width: 24px;
  height: 24px;
  background-color: #666;
  mask: url('@/assets/search.svg') no-repeat center;
  mask-size: contain;
  -webkit-mask: url('@/assets/search.svg') no-repeat center;
  -webkit-mask-size: contain;
  transition: background-color 0.2s ease;
}

.search-btn:hover .search-icon {
  background-color: #3b82f6;
}

.search-btn:active .search-icon {
  background-color: #2563eb;
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3), 0 2px 6px 2px rgba(60, 64, 67, 0.15);
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  margin-top: 4px;
}

.autocomplete-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.autocomplete-item:last-child {
  border-bottom: none;
}

.autocomplete-item:hover,
.autocomplete-item.active {
  background-color: #f8f9fa;
}

.autocomplete-item.loading {
  color: #666;
  font-style: italic;
  cursor: default;
}

.autocomplete-item.loading:hover {
  background-color: transparent;
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