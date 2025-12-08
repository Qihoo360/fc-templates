import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Notification {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString()
    const newNotification: Notification = {
      id,
      ...notification,
      duration: notification.duration ?? 3000, // 如果没有传递duration或为undefined，使用默认值3000
    }
    
    notifications.value.push(newNotification)

    // 自动移除通知
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    return id
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const success = (message: string, duration?: number) => {
    return addNotification({ message, type: 'success', duration })
  }

  const error = (message: string, duration?: number) => {
    return addNotification({ message, type: 'error', duration })
  }

  const warning = (message: string, duration?: number) => {
    return addNotification({ message, type: 'warning', duration })
  }

  const info = (message: string, duration?: number) => {
    return addNotification({ message, type: 'info', duration })
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    warning,
    info
  }
})