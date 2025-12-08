<template>
  <div class="fixed top-4 right-4 z-50 space-y-2">
    <div
      v-for="notification in notificationStore.notifications"
      :key="notification.id"
      :class="[
        'max-w-md w-full shadow-lg rounded-lg pointer-events-auto overflow-hidden',
        getNotificationClasses(notification.type)
      ]"
      class="transform transition-all duration-300 ease-in-out"
    >
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <component :is="getIcon(notification.type)" class="h-5 w-5" />
          </div>
          <div class="ml-3 flex-1 min-w-0">
            <p class="text-sm font-medium break-words">
              {{ notification.message }}
            </p>
          </div>
          <div class="ml-4 flex-shrink-0">
            <button
              @click="notificationStore.removeNotification(notification.id)"
              class="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
            >
              <X class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNotificationStore } from '@/stores/notificationStore'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-vue-next'

const notificationStore = useNotificationStore()

const getNotificationClasses = (type: string) => {
  switch (type) {
    case 'success':
      return 'bg-green-50 border border-green-200 text-green-800'
    case 'error':
      return 'bg-red-50 border border-red-200 text-red-800'
    case 'warning':
      return 'bg-yellow-50 border border-yellow-200 text-yellow-800'
    case 'info':
      return 'bg-blue-50 border border-blue-200 text-blue-800'
    default:
      return 'bg-gray-50 border border-gray-200 text-gray-800'
  }
}

const getIcon = (type: string) => {
  switch (type) {
    case 'success':
      return CheckCircle
    case 'error':
      return XCircle
    case 'warning':
      return AlertTriangle
    case 'info':
      return Info
    default:
      return Info
  }
}
</script>