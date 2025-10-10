import mitt from 'mitt'
import { onBeforeUnmount } from 'vue'

type EventCallback = (...args: any[]) => void

interface Option {
  name: string
  callback: EventCallback
}

const emitter = mitt()

// Map to store debounce information
const lazyDebounceMap = new Map<
  string,
  {
    timer: any | null
    isPending: boolean
  }
>()

/**
 * Basic event emitter hook
 * @param option - Optional configuration with event name and callback
 * @returns Object containing the emitter instance
 */
export const useEmitt = (option?: Option) => {
  if (option) {
    emitter.on(option.name, option.callback)

    onBeforeUnmount(() => {
      emitter.off(option.name, option.callback)
    })
  }
  return {
    emitter,
  }
}

/**
 * Debounced event emitter
 * @param eventName - Name of the event to emit
 * @param params - Parameters to pass with the event
 * @param delay - Debounce delay in milliseconds (default: 200ms)
 */
export const useEmittLazy = (eventName: string, params: any = null, delay = 150) => {
  // If there's already a pending execution, skip this call
  if (lazyDebounceMap.has(eventName)) {
    const entry = lazyDebounceMap.get(eventName)!
    if (entry.isPending) {
      return
    }
  }

  // Clear existing timer if present
  if (lazyDebounceMap.has(eventName)) {
    const { timer } = lazyDebounceMap.get(eventName)!
    if (timer) {
      clearTimeout(timer)
    }
  }

  // Set up a new timer
  const timer = setTimeout(() => {
    emitter.emit(eventName, params)

    // Mark execution as complete
    if (lazyDebounceMap.has(eventName)) {
      lazyDebounceMap.get(eventName)!.isPending = false
    }
  }, delay)

  // Store timer information and mark as pending
  lazyDebounceMap.set(eventName, {
    timer,
    isPending: true,
  })

  // Clean up on component unmount
  onBeforeUnmount(() => {
    if (lazyDebounceMap.has(eventName)) {
      const { timer } = lazyDebounceMap.get(eventName)!
      if (timer) {
        clearTimeout(timer)
      }
      lazyDebounceMap.delete(eventName)
    }
  })
}
