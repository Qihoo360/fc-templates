<template>
  <div class="border rounded-lg overflow-hidden flex flex-col flex-1 min-h-0">
    <div class="bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 flex items-center justify-between flex-shrink-0">
      <span>关键指令</span>
      <div class="flex items-center space-x-2">
        <button
          @click="$emit('regenerate')"
          :disabled="isExecuting || isGenerating"
          class="text-purple-500 hover:text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title="重新生成关键指令"
        >
          <RefreshCw :class="['w-4 h-4', (isExecuting && currentExecutionStep === 'thinking') && 'animate-spin']" />
        </button>
        <button
          @click="$emit('copy')"
          class="text-purple-500 hover:text-purple-600"
          title="复制到剪贴板"
        >
          <Check v-if="isCopied" class="w-4 h-4" />
          <Copy v-else class="w-4 h-4" />
        </button>
      </div>
    </div>
    <div class="bg-white flex flex-col" :class="isMobile ? 'flex-1 min-h-0' : 'p-3 flex-1'">
      <div ref="scrollContainer" class="space-y-2 overflow-y-auto flex-1" :class="isMobile ? 'p-3' : ''" :style="isMobile ? '' : 'max-height: calc(100vh - 400px);'">
        <div 
          v-for="(point, index) in thinkingPoints" 
          :key="index"
          class="flex items-start"
        >
          <span class="text-purple-500 mr-2 mt-2">•</span>
          <input
            :value="point"
            @input="$emit('update-point', index, ($event.target as HTMLInputElement).value)"
            @focus="($event.target as HTMLInputElement).setSelectionRange(($event.target as HTMLInputElement).value.length, ($event.target as HTMLInputElement).value.length)"
            class="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            @click="$emit('remove-point', index)"
            class="ml-2 px-2 py-1 text-red-500 hover:text-red-700 text-sm"
            title="删除这条指令"
          >
            ×
          </button>
        </div>
      </div>
      
      <div class="p-3 pt-4 flex justify-between flex-shrink-0 border-t border-gray-100 bg-white">
        <button
          @click="$emit('add-point')"
          class="px-3 py-1 text-purple-600 hover:text-purple-800 text-sm"
        >
          + 添加指令
        </button>
        
        <div v-if="!isAutoMode">
          <button
            @click="$emit('execute-initial')"
            :disabled="!thinkingPoints || thinkingPoints.length === 0 || isExecuting"
            class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <RefreshCw v-if="isExecuting && currentExecutionStep === 'initial'" class="w-4 h-4 animate-spin" />
            <span>{{ (isExecuting && currentExecutionStep === 'initial') ? '执行中...' : '生成初始提示词' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RefreshCw, Copy, Check } from 'lucide-vue-next'
import { useAutoScroll } from '../../composables/useAutoScroll'

const props = defineProps<{
  thinkingPoints: string[]
  isMobile?: boolean
  isAutoMode: boolean
  isExecuting: boolean
  isGenerating: boolean
  currentExecutionStep: 'report' | 'thinking' | 'initial' | 'advice' | 'final' | null
  isCopied: boolean
}>()

const emit = defineEmits<{
  'regenerate': []
  'copy': []
  'add-point': []
  'remove-point': [index: number]
  'update-point': [index: number, value: string]
  'execute-initial': []
  'scroll-mounted': [element: HTMLElement]
}>()

const scrollContainer = ref<HTMLDivElement>()

const { setScrollContainer } = useAutoScroll(
  () => props.thinkingPoints,
  () => props.isGenerating
)

onMounted(() => {
  if (scrollContainer.value) {
    setScrollContainer(scrollContainer.value)
    emit('scroll-mounted', scrollContainer.value)
  }
})
</script>
