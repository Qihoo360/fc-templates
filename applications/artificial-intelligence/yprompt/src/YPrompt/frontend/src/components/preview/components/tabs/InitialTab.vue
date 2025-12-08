<template>
  <div class="border rounded-lg overflow-hidden flex flex-col flex-1">
    <div class="bg-green-50 px-3 py-2 text-sm font-medium text-green-700 flex items-center justify-between flex-shrink-0">
      <span>初始提示词</span>
      <div class="flex items-center space-x-2">
        <button
          @click="$emit('regenerate')"
          :disabled="isExecuting || isGenerating"
          class="text-green-500 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title="重新生成初始提示词"
        >
          <RefreshCw :class="['w-4 h-4', (isExecuting && currentExecutionStep === 'initial') && 'animate-spin']" />
        </button>
        <button
          @click="$emit('copy')"
          class="text-green-500 hover:text-green-600"
          title="复制到剪贴板"
        >
          <Check v-if="isCopied" class="w-4 h-4" />
          <Copy v-else class="w-4 h-4" />
        </button>
      </div>
    </div>
    <div class="p-3 bg-white flex-1 flex flex-col overflow-hidden">
      <textarea
        ref="textareaRef"
        :value="initialPrompt"
        @input="$emit('update:initialPrompt', ($event.target as HTMLTextAreaElement).value)"
        class="w-full flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
      ></textarea>
      
      <div v-if="!isAutoMode" class="mt-4 flex justify-end flex-shrink-0">
        <button
          @click="$emit('execute-advice')"
          :disabled="!initialPrompt || isExecuting"
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          <RefreshCw v-if="isExecuting && currentExecutionStep === 'advice'" class="w-4 h-4 animate-spin" />
          <span>{{ (isExecuting && currentExecutionStep === 'advice') ? '执行中...' : '生成优化建议' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RefreshCw, Copy, Check } from 'lucide-vue-next'
import { useAutoScroll } from '../../composables/useAutoScroll'

const props = defineProps<{
  initialPrompt: string
  isAutoMode: boolean
  isExecuting: boolean
  isGenerating: boolean
  currentExecutionStep: 'report' | 'thinking' | 'initial' | 'advice' | 'final' | null
  isCopied: boolean
}>()

const emit = defineEmits<{
  'update:initialPrompt': [value: string]
  'regenerate': []
  'copy': []
  'execute-advice': []
  'scroll-mounted': [element: HTMLElement]
}>()

const textareaRef = ref<HTMLTextAreaElement>()

const { setScrollContainer } = useAutoScroll(
  () => props.initialPrompt,
  () => props.isGenerating
)

onMounted(() => {
  if (textareaRef.value) {
    setScrollContainer(textareaRef.value)
    emit('scroll-mounted', textareaRef.value)
  }
})
</script>
