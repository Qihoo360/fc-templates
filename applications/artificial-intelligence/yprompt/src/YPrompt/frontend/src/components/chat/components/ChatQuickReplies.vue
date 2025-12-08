<template>
  <div 
    v-if="show" 
    ref="containerRef" 
    class="px-6 py-3 bg-gray-50 border-b border-gray-200 shadow-lg z-10"
    :style="quickRepliesStyle"
  >
    <div class="text-xs text-gray-500 mb-2">快速回复：</div>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="reply in replies"
        :key="reply"
        @click="$emit('select', reply)"
        class="px-3 py-1 text-sm bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
      >
        {{ reply }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const props = defineProps<{
  show: boolean
  replies: string[]
  quickRepliesContainer?: { value: HTMLElement | undefined }
  inputContainerRef?: HTMLElement
}>()

defineEmits<{
  select: [reply: string]
}>()

const containerRef = ref<HTMLElement>()

const quickRepliesStyle = computed<Record<string, string>>(() => {
  if (!props.inputContainerRef) {
    return {
      position: 'absolute',
      bottom: '100%',
      left: '0',
      right: '0'
    }
  }
  
  const rect = props.inputContainerRef.getBoundingClientRect()
  return {
    position: 'fixed',
    bottom: `${window.innerHeight - rect.top}px`,
    left: `${rect.left}px`,
    right: `${window.innerWidth - rect.right}px`
  }
})

// 同步 ref 到 quickRepliesContainer
watch(containerRef, (newVal) => {
  if (props.quickRepliesContainer) {
    props.quickRepliesContainer.value = newVal
  }
})
</script>
