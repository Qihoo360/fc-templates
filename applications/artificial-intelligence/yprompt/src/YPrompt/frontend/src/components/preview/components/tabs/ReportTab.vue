<template>
  <div class="border rounded-lg overflow-hidden flex flex-col flex-1">
    <div class="bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700 flex items-center justify-between flex-shrink-0">
      <span>需求描述</span>
      <div class="flex items-center space-x-2">
        <button
          @click="$emit('regenerate')"
          :disabled="isExecuting || isGenerating"
          class="text-orange-500 hover:text-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title="重新生成需求描述"
        >
          <RefreshCw :class="['w-4 h-4', (isExecuting && currentExecutionStep === 'report') && 'animate-spin']" />
        </button>
        <button
          @click="$emit('copy')"
          class="text-orange-500 hover:text-orange-600"
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
        :value="requirementReport"
        @input="$emit('update:requirementReport', ($event.target as HTMLTextAreaElement).value)"
        :placeholder="hasConversationData ? '基于对话生成的需求描述...' : '请直接描述您的需求，例如：我需要一个专业的代码审查助手，能够分析代码质量、发现潜在问题并提供改进建议...'"
        class="w-full flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-0 resize-none"
      ></textarea>
      
      <div class="mt-4 flex justify-end flex-shrink-0">
        <div v-if="isAutoMode">
          <button
            @click="$emit('execute-full')"
            :disabled="!requirementReport.trim() || isExecuting || isGenerating"
            class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <RefreshCw v-if="isExecuting || isGenerating" class="w-4 h-4 animate-spin" />
            <span>{{ (isExecuting || isGenerating) ? '自动生成中...' : '自动生成提示词' }}</span>
          </button>
        </div>
        
        <div v-if="!isAutoMode">
          <button
            @click="$emit('execute-thinking')"
            :disabled="!requirementReport.trim() || isExecuting"
            class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <RefreshCw v-if="isExecuting && currentExecutionStep === 'thinking'" class="w-4 h-4 animate-spin" />
            <span>{{ (isExecuting && currentExecutionStep === 'thinking') ? '执行中...' : '生成关键指令' }}</span>
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
  requirementReport: string
  hasConversationData: boolean
  isAutoMode: boolean
  isExecuting: boolean
  isGenerating: boolean
  currentExecutionStep: 'report' | 'thinking' | 'initial' | 'advice' | 'final' | null
  isCopied: boolean
}>()

const emit = defineEmits<{
  'update:requirementReport': [value: string]
  'regenerate': []
  'copy': []
  'execute-full': []
  'execute-thinking': []
  'scroll-mounted': [element: HTMLElement]
}>()

const textareaRef = ref<HTMLTextAreaElement>()

const { setScrollContainer } = useAutoScroll(
  () => props.requirementReport,
  () => props.isGenerating
)

onMounted(() => {
  if (textareaRef.value) {
    setScrollContainer(textareaRef.value)
    emit('scroll-mounted', textareaRef.value)
  }
})
</script>
