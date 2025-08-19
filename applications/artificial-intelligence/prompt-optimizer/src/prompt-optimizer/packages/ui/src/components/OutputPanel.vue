<!-- 输出面板组件 -->
<template>
  <div class="flex flex-col h-full" :class="$attrs.class">
    <div class="flex items-center justify-between mb-3">
      <h3 v-if="resultTitle" class="text-lg font-semibold theme-text truncate">{{ resultTitle }}</h3>
      <div v-else-if="!hideTitle" class="text-lg font-semibold theme-text">{{ t('output.title') }}</div>
      <div v-else></div>
      
      <div class="flex items-center space-x-2">
        <button
          v-if="contentTokens.length > 0 && !isStreaming"
          @click="copySelectedText"
          class="px-3 py-1.5 theme-button-secondary flex items-center space-x-2"
        >
          <span>{{ t('prompt.copy') }}</span>
        </button>
        <button
          @click="isFullscreen = true"
          class="px-3 py-1.5 theme-button-secondary flex items-center space-x-2"
          :title="t('common.expand')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>
    </div>

    <div class="flex-1 min-h-0 relative">
      <div class="h-full relative">
        <div
          ref="resultContainer"
          class="absolute inset-0 h-full theme-input whitespace-pre-wrap overflow-auto"
        >
          <span v-if="!contentTokens.length" class="theme-text-placeholder">{{ t('output.placeholder') }}</span>
          <MarkdownRenderer v-else-if="props.enableMarkdown" :content="displayContent" />
          <span v-else v-text="displayContent" class="theme-text"></span>
        </div>
      </div>

      <div
        v-if="error"
        class="absolute top-2 right-2 theme-error px-3 py-1.5 rounded-lg flex items-center space-x-2"
      >
        <span>❌</span>
        <span>{{ error }}</span>
      </div>

      <div
        v-if="(loading || (isStreaming && contentTokens.length === 0))"
        class="absolute top-2 right-2 theme-loading px-3 py-1.5 rounded-lg flex items-center space-x-2"
      >
        <span class="animate-spin">⏳</span>
        <span>{{ t('output.processing') }}</span>
      </div>
    </div>
  </div>
  <FullscreenDialog v-model="isFullscreen" :title="resultTitle || t('output.title')">
    <div class="h-full theme-input whitespace-pre-wrap">
      <MarkdownRenderer v-if="props.enableMarkdown" :content="displayContent" />
      <span v-else v-text="displayContent" class="theme-text"></span>
    </div>
  </FullscreenDialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '../composables/useToast'
import { useAutoScroll } from '../composables/useAutoScroll'
import { useClipboard } from '../composables/useClipboard'
import MarkdownRenderer from './MarkdownRenderer.vue'
import FullscreenDialog from './FullscreenDialog.vue'

// 禁用属性自动继承，手动处理class属性
defineOptions({
  inheritAttrs: false
})

const { t } = useI18n()
const toast = useToast()
const { copyText } = useClipboard()
const contentTokens = ref<string[]>([])
const isStreaming = ref(false)
const isFullscreen = ref(false)

// 使用自动滚动组合式函数
const { elementRef: resultContainer, onContentChange, forceScrollToBottom, shouldAutoScroll } = useAutoScroll<HTMLDivElement>({
  debug: import.meta.env.DEV,
  threshold: 20
})

// 计算完整内容
const displayContent = computed(() => {
  return contentTokens.value.join('');
})

// 监听组件挂载
onMounted(async () => {
  await nextTick();
});

interface Props {
  loading?: boolean;
  error?: string;
  result?: string;
  hideTitle?: boolean;
  resultTitle?: string;
  enableMarkdown?: boolean;
}

const props = defineProps<Props>()

// 定义事件
const emit = defineEmits<{
  'update:result': [value: string];
}>()

// 监听 result 变化
watch(() => props.result, (newVal) => {
  if (!selfUpdate && !isStreaming.value && newVal) {
    contentTokens.value = [newVal]
    // 通知内容变化，触发高度检查
    onContentChange()
  }
})

// 更新文本
const updateContent = (text: string) => {
  contentTokens.value.push(text)
  
  // 通知内容变化，触发高度检查
  onContentChange()
};

interface StreamHandlers {
  onToken: (token: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}
let selfUpdate = false;
// 处理流式响应
const handleStream = (): StreamHandlers => {
  isStreaming.value = true;
  contentTokens.value = [];
  
  return {
    onToken: (token: string) => {
      // 直接更新内容
      updateContent(token);
    },
    onComplete: () => {
      const finalContent = contentTokens.value.join(''); // 保存一份最终内容
      isStreaming.value = false;
      
      // 流式响应结束后，确保内容完全可见
      nextTick(() => {
        forceScrollToBottom()
      })

      // 设置标记，表示这是自身触发的更新
      selfUpdate = true;
      emit('update:result', finalContent);
      // 给标记一个恢复的延时
      setTimeout(() => {
        selfUpdate = false;
      }, 100);
    },
    onError: (error: Error) => {
      console.error('Stream error:', error);
      isStreaming.value = false;
      toast.error(error.message);
    }
  };
};

defineExpose({ 
  handleStream,
  contentTokens,
  displayContent,
  resultContainer,
  isAutoScrollEnabled: shouldAutoScroll, // 暴露自动滚动状态
  forceScrollToBottom  // 暴露手动滚动方法
})

// 复制选中的文本，如果没有选中则复制全部
const copySelectedText = async () => {
  if (!resultContainer.value) return
  
  const selection = window.getSelection()
  const selectedText = selection?.toString() || ''
  const textToCopy = selectedText || displayContent.value
  
  copyText(textToCopy)
}
</script>

<style scoped>
.whitespace-pre-wrap {
  white-space: pre-wrap;
}

.token-item {
  display: inline;
}

/* 隐藏滚动条但保持可滚动 */
.overflow-auto {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.overflow-auto::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}
</style>