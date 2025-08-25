<template>
  <div class="searchbar-container">
    <form class="search-bar" @submit="handleSubmit">
      <input ref="searchInput" v-model="searchQuery" type="text" :placeholder="placeholder" class="search-input"
        spellcheck="false" @input="handleInput" @focus="showResults = true" @blur="handleBlur"
        @keydown="handleKeydown" />
    </form>

    <div v-if="showResults && searchResults.length > 0" class="autocomplete-dropdown">
      <div v-for="(result, index) in searchResults" :key="index" class="autocomplete-item"
        :class="{ active: selectedIndex === index }"
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
import { ref, watch } from 'vue'
import { useNotifications } from '@/composables/useNotifications.js'

const props = defineProps({
  placeholder: {
    type: String,
    default: 'Search destination'
  },
  value: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['select', 'clear'])

const { showError } = useNotifications()

const searchQuery = ref('')
const searchResults = ref([])
const showResults = ref(false)
const selectedIndex = ref(-1)
const searchInput = ref(null)
let abortController = null

watch(() => props.value, (newValue) => {
  if (newValue?.name) {
    searchQuery.value = newValue.name
  } else {
    searchQuery.value = ''
  }
}, { immediate: true })

const handleInput = (event) => {
  const query = event.target.value
  searchQuery.value = query
  
  // If user is typing and there's a selected value, clear it
  if (props.value && query !== props.value.name) {
    emit('clear')
  }
  
  if (query.trim()) {
    performSearch(query)
  } else {
    searchResults.value = []
    showResults.value = false
  }
}

const performSearch = async (query) => {
  // Cancel previous request
  abortController?.abort()
  abortController = new AbortController()

  selectedIndex.value = -1

  try {
    const response = await fetch(`http://192.168.1.153:3001/geocode?q=${encodeURIComponent(query)}&limit=4`, {
      signal: abortController.signal
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    searchResults.value = data.features || []
    showResults.value = true

  } catch (error) {
    if (error.name !== 'AbortError') {
      showError('Search Failed', 'Unable to search for locations. Please try again.')
      searchResults.value = []
    }
  }
}
const handleSubmit = (event) => {
  event.preventDefault()
  
  // If there are search results, select the first one
  if (searchResults.value.length > 0) {
    const indexToSelect = selectedIndex.value >= 0 ? selectedIndex.value : 0
    selectResult(searchResults.value[indexToSelect])
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
      selectedIndex.value = selectedIndex.value < searchResults.value.length - 1 
        ? selectedIndex.value + 1 
        : 0
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = selectedIndex.value > 0 
        ? selectedIndex.value - 1 
        : searchResults.value.length - 1
      break
    case 'Enter':
      event.preventDefault()
      if (searchResults.value.length > 0) {
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

  emit('select', {
    name: result.properties.name,
    coordinates: result.geometry.coordinates,
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
  color: #777777;
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