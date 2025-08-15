<template>
  <div v-if="show" class="toast" :class="type">
    <div class="content">
      <div class="message">
        <div class="title">{{ title }}</div>
        <div v-if="message" class="text">{{ message }}</div>
      </div>
      <Button @close="close" class="close-toast-btn" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Button from '@/components/Button.vue'

defineProps({
  title: String,
  message: String,
  type: { type: String, default: 'error' }
})

const emit = defineEmits(['close'])
const show = ref(false)

function close() {
  show.value = false
  emit('close')
}

onMounted(() => {
  show.value = true
  setTimeout(close, 5000)
})
</script>

<style scoped>
.toast {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1000;
  width: 320px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
  border-left: 4px solid #dc2626;
}

.warning {
  border-left-color: #d97706;
}

.content {
  display: flex;
  padding: 16px;
  gap: 12px;
}

.message {
  flex: 1;
  min-width: 0;
  word-wrap: break-word;
}

.title {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
  line-height: 1.3;
  word-wrap: break-word;
}

.text {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  word-wrap: break-word;
}

.close-toast-btn {
  position: relative;
  min-width: 28px;
  height: 28px;
  font-size: 1.5rem;
}

.close-toast-btn:hover {
  box-shadow:
    inset 2px 2px 4px rgba(0, 0, 0, 0.02),
    inset -1px -1px 2px rgba(255, 255, 255, 0.8);
}

.close-toast-btn:active {
  box-shadow:
    inset 3px 3px 6px rgba(0, 0, 0, 0.1),
    inset -2px -2px 4px rgba(255, 255, 255, 0.7);
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
</style>
