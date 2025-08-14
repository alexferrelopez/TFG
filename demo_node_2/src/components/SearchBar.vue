<template>
  <div class="search-bar">
    <input 
      type="text" 
      placeholder="Search destination" 
      class="search-input"
      spellcheck="false"
      @input="handleInput"
    />
    <button class="search-btn" type="button">
      <div class="search-icon"></div>
    </button>
  </div>
</template>

<script setup>
const emit = defineEmits(['search'])

const handleInput = (event) => {
  const target = event.target
  if (target) {
    emit('search', target.value)
  }
}
</script>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3), 0 2px 6px 2px rgba(60, 64, 67, 0.15);
  overflow: hidden;
  max-width: 400px;
  width: 100%;
}

.search-input {
  flex: 1;
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
</style>