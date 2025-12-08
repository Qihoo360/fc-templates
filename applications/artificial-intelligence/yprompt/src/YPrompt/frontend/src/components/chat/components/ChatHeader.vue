<template>
  <div class="p-4 border-b border-gray-200 flex-shrink-0">
    <div class="flex justify-between items-center">
      <div class="flex items-center space-x-2">
        <h2 class="font-semibold text-gray-800">AI助手对话</h2>
        <button
          @click="$emit('toggle-model-selector')"
          class="p-1 hover:bg-gray-100 rounded transition-colors"
          :title="modelTitle"
        >
          <svg class="w-4 h-4 text-gray-600 hover:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4 4m4-4l-4-4m0 6H4m0 0l4 4m-4-4l4-4"/>
          </svg>
        </button>
      </div>
      <div class="flex items-center space-x-3">
        <button
          v-if="isMobile && isExpanded"
          @click="$emit('toggle')"
          class="p-1 hover:bg-gray-100 rounded transition-colors"
          title="折叠"
        >
          <ChevronUp class="w-5 h-5 text-gray-500" />
        </button>
        
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-600">流式:</span>
          <button
            @click="$emit('toggle-stream')"
            :class="[
              'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
              isStreamMode ? 'bg-blue-500' : 'bg-gray-300'
            ]"
            :title="isStreamMode ? '关闭流式模式' : '开启流式模式'"
          >
            <span
              :class="[
                'inline-block h-3 w-3 transform rounded-full bg-white transition-transform',
                isStreamMode ? 'translate-x-5' : 'translate-x-1'
              ]"
            />
          </button>
        </div>
        
        <button
          @click="$emit('clear-chat')"
          class="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="重新开始"
        >
          <RefreshCw class="w-4 h-4" />
          <span>重新开始</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronUp, RefreshCw } from 'lucide-vue-next'

defineProps<{
  isMobile?: boolean
  isExpanded?: boolean
  isStreamMode: boolean
  modelTitle: string
}>()

defineEmits<{
  'toggle-model-selector': []
  'toggle': []
  'toggle-stream': []
  'clear-chat': []
}>()
</script>
