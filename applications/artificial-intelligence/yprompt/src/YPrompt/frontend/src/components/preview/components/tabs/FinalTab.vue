<template>
  <div class="border rounded-lg overflow-hidden flex flex-col flex-1">
    <div class="bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 flex items-center justify-between flex-shrink-0">
      <span>最终提示词</span>
      <div class="flex items-center space-x-2">
        <button
          @click="$emit('regenerate')"
          :disabled="isExecuting || isGenerating"
          class="text-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title="重新生成最终提示词"
        >
          <RefreshCw :class="['w-4 h-4', (isExecuting && currentExecutionStep === 'final') && 'animate-spin']" />
        </button>
        <button
          @click="$emit('copy')"
          class="text-blue-500 hover:text-blue-600"
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
        :value="generatedPrompt"
        @input="$emit('update:generatedPrompt', ($event.target as HTMLTextAreaElement).value)"
        class="w-full flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none resize-none"
      ></textarea>
      
      <div v-if="generatedPrompt" class="space-y-2 pt-4 flex-shrink-0">
        <!-- 第一行：格式转换、语言转换、保存 -->
        <div class="flex space-x-2">
          <button 
            @click="$emit('toggle-format')"
            :disabled="!generatedPrompt || isConvertingFormat || isConvertingLanguage"
            class="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw v-if="isConvertingFormat" class="w-4 h-4 animate-spin" />
            <span>{{ isConvertingFormat ? '转换中...' : (formatState === 'markdown' ? '转为XML格式' : '转为Markdown格式') }}</span>
          </button>
          <button 
            @click="$emit('toggle-language')"
            :disabled="!generatedPrompt || isConvertingFormat || isConvertingLanguage"
            class="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw v-if="isConvertingLanguage" class="w-4 h-4 animate-spin" />
            <span>{{ isConvertingLanguage ? '转换中...' : (languageState === 'zh' ? '转为英文版' : '转为中文版') }}</span>
          </button>
          <button 
            @click="$emit('save-prompt')"
            :disabled="!generatedPrompt || isConvertingFormat || isConvertingLanguage || isSaving"
            class="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw v-if="isSaving" class="w-4 h-4 animate-spin" />
            <span>{{ isSaving ? '保存中...' : '保存到数据库' }}</span>
          </button>
        </div>
        <!-- 第二行：对比按钮（仅在优化页面显示） -->
        <div v-if="showCompareButton" class="flex">
          <button 
            @click="$emit('compare')"
            :disabled="!generatedPrompt"
            class="w-full flex items-center justify-center space-x-1 px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeftRight class="w-4 h-4" />
            <span>对比优化效果</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RefreshCw, Copy, Check, ArrowLeftRight } from 'lucide-vue-next'
import { useAutoScroll } from '../../composables/useAutoScroll'

const props = withDefaults(defineProps<{
  generatedPrompt: string
  isExecuting: boolean
  isGenerating: boolean
  currentExecutionStep: 'report' | 'thinking' | 'initial' | 'advice' | 'final' | null
  isCopied: boolean
  isConvertingFormat: boolean
  isConvertingLanguage: boolean
  isSaving: boolean
  formatState: 'markdown' | 'xml'
  languageState: 'zh' | 'en'
  showCompareButton?: boolean  // 是否显示对比按钮，默认false（生成页面不显示）
}>(), {
  showCompareButton: false
})

const emit = defineEmits<{
  'update:generatedPrompt': [value: string]
  'regenerate': []
  'copy': []
  'toggle-format': []
  'toggle-language': []
  'save-prompt': []
  'compare': []
  'scroll-mounted': [element: HTMLElement]
}>()

const textareaRef = ref<HTMLTextAreaElement>()

const { setScrollContainer } = useAutoScroll(
  () => props.generatedPrompt,
  () => props.isGenerating
)

onMounted(() => {
  if (textareaRef.value) {
    setScrollContainer(textareaRef.value)
    emit('scroll-mounted', textareaRef.value)
  }
})
</script>
