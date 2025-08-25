import { createApp } from 'vue'
import NotificationToast from '@/components/layout/NotificationToast.vue'

let currentNotification = null

export function useNotifications() {
  function showNotification({ title, message = '', type = 'info' }) {
    // Remove existing notification if any
    if (currentNotification) {
      currentNotification.app.unmount()
      document.body.removeChild(currentNotification.container)
      currentNotification = null
    }
    
    const container = document.createElement('div')
    document.body.appendChild(container)
    
    const app = createApp(NotificationToast, {
      title,
      message,
      type,
      onClose: () => {
        app.unmount()
        document.body.removeChild(container)
        currentNotification = null
      }
    })
    
    app.mount(container)
    
    // Store reference to current notification
    currentNotification = { app, container }
  }

  function showError(title, message) {
    showNotification({ title, message, type: 'error' })
  }

  function showWarning(title, message) {
    showNotification({ title, message, type: 'warning' })
  }

  return {
    showError,
    showWarning
  }
}
