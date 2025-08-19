import { ref } from 'vue'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

const toasts = ref<Toast[]>([])

export function useToast() {
  const add = (message: string, type: Toast['type'] = 'info', duration: number = 3000) => {
    const id = Date.now()
    toasts.value.push({ id, message, type })

    setTimeout(() => {
      remove(id)
    }, duration)
  }

  const remove = (id: number) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (message: string, duration?: number) => add(message, 'success', duration)
  const error = (message: string, duration?: number) => add(message, 'error', duration)
  const info = (message: string, duration?: number) => add(message, 'info', duration)
  const warning = (message: string, duration?: number) => add(message, 'warning', duration)

  return {
    toasts,
    add,
    remove,
    success,
    error,
    info,
    warning
  }
}
