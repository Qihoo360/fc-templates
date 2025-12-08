<template>
  <div class="bg-white rounded-lg shadow-sm flex flex-col h-full overflow-hidden border border-gray-100">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
      <div class="h-6">AI对话</div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">流式:</span>
          <button
            @click="$emit('toggle-stream')"
            :class="[
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
              isStreamMode ? 'bg-blue-500' : 'bg-gray-300'
            ]"
            :title="isStreamMode ? '关闭流式输出' : '开启流式输出'"
          >
            <span
              :class="[
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                isStreamMode ? 'translate-x-6' : 'translate-x-1'
              ]"
            />
          </button>
        </div>

        <button
          class="p-2 rounded-lg border transition-colors"
          :class="hasSystemPrompt ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'"
          @click="$emit('open-system-prompt')"
          title="设置系统提示词"
        >
          <FileText class="w-4 h-4" />
        </button>

        <button
          @click="$emit('clear')"
          class="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="重新开始"
        >
          <RefreshCw class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Messages -->
    <div ref="scrollRef" class="flex-1 overflow-y-auto bg-gray-50 px-4 py-6 space-y-5">
      <div
        v-if="messages.length === 0"
        class="h-full flex flex-col items-center justify-center text-gray-400 p-6 text-center"
      >
        <div class="w-16 h-16 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mb-4">
          <Sparkles class="w-8 h-8 text-gray-300" />
        </div>
        <p class="text-base font-medium text-gray-700 mb-2">欢迎使用提示词操练场</p>
        <p class="text-sm text-gray-500 max-w-xs">
          对话生成结果会在右侧实时渲染
        </p>
      </div>

      <div v-for="msg in messages" :key="msg.id" class="space-y-2">
        <div v-if="msg.role === 'user'" class="flex justify-end">
          <div
            class="bg-blue-500 text-white px-4 py-3 rounded-2xl rounded-tr-md max-w-xl whitespace-pre-wrap text-sm shadow-sm"
          >
            {{ msg.text }}
          </div>
        </div>
        <div v-else class="flex items-start gap-3">
          <div class="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
            <Sparkles class="w-5 h-5 text-blue-500" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <span class="font-medium text-gray-900">AI助手</span>
            </div>
            <div class="bg-white text-gray-800 px-4 py-3 rounded-2xl rounded-tl-md border border-gray-200 shadow-sm">
              <template v-if="msg.isStreaming">
                <template v-if="hasContent(msg)">
                  <pre
                    v-if="shouldDisplayAsCode(msg.displayText || msg.text)"
                    class="playground-code-block"
                  >{{ msg.displayText || msg.text }}</pre>
                  <div
                    v-else
                    class="markdown-body prose prose-sm max-w-none text-gray-800"
                    v-html="renderMarkdown(msg.displayText || msg.text)"
                  ></div>
                </template>
                <div v-else class="flex items-center gap-1 text-gray-400">
                  <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                  <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></span>
                  <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
                </div>
              </template>
              <template v-else>
                <pre
                  v-if="shouldDisplayAsCode(msg.text)"
                  class="playground-code-block"
                >{{ msg.text }}</pre>
                <div
                  v-else
                  class="markdown-body prose prose-sm max-w-none text-gray-800"
                  v-html="renderMarkdown(msg.text)"
                ></div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="p-3 border-t border-gray-200 bg-white flex-shrink-0">
      <div class="max-w-4xl mx-auto relative">
        <div 
          class="relative border border-gray-300 rounded-2xl focus-within:outline-none focus-within:border-gray-300 overflow-hidden" 
          style="height: 120px;"
        >
          <div class="absolute top-0 left-0 right-0" style="bottom: 48px;">
            <textarea
              ref="textareaRef"
              v-model="inputVal"
              rows="1"
              class="w-full h-full px-3 pt-3 pb-1 border-0 outline-none resize-none text-base overflow-y-auto bg-transparent"
              :placeholder="placeholderText"
              @keydown="handleKeydown"
              @input="autoResize"
            ></textarea>
          </div>
          <div class="absolute bottom-0 left-0 right-0 h-12 flex items-center justify-end px-3 bg-transparent pointer-events-none">
            <button
              @click="sendMessage"
              :disabled="!inputVal.trim() || isStreaming"
              class="w-8 h-8 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center pointer-events-auto"
            >
              <ArrowUp class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUpdated } from 'vue'
import { Sparkles, RefreshCw, ArrowUp, FileText } from 'lucide-vue-next'

interface PlaygroundMessage {
  id: string
  role: 'user' | 'model'
  text: string
  displayText?: string
  isStreaming?: boolean
}

const props = defineProps<{
  messages: PlaygroundMessage[]
  isStreaming: boolean
  isStreamMode: boolean
  hasSystemPrompt: boolean
  currentModelName: string
}>()

const emit = defineEmits<{
  'send': [payload: { text: string }]
  'clear': []
  'toggle-stream': []
  'open-system-prompt': []
}>()

const inputVal = ref('')
const scrollRef = ref<HTMLElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const placeholderText = computed(() => 'Shift+Enter 换行')

const messages = computed(() => props.messages)

const scrollToBottom = () => {
  if (!scrollRef.value) return
  const el = scrollRef.value
  const distance = el.scrollHeight - el.scrollTop - el.clientHeight
  if (distance < 300) {
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }
}

const highlightCode = () => {
  if (!scrollRef.value || props.isStreaming) return
  const blocks = scrollRef.value.querySelectorAll('pre code')
  blocks.forEach((block) => {
    const codeEl = block as HTMLElement & { dataset: DOMStringMap }
    if (!(window as any).hljs || codeEl.dataset.highlighted) return
    ;(window as any).hljs.highlightElement(codeEl)
    codeEl.dataset.highlighted = 'yes'
  })
}

const syncLucideIcons = () => {
  if (typeof window !== 'undefined' && (window as any).lucide?.createIcons) {
    (window as any).lucide.createIcons()
  }
}

const autoResize = () => {
  if (!textareaRef.value) return
  textareaRef.value.style.height = 'auto'
  textareaRef.value.style.height = `${Math.min(textareaRef.value.scrollHeight, 200)}px`
}

watch(
  () => props.messages,
  () => {
    nextTick(() => {
      scrollToBottom()
      highlightCode()
      syncLucideIcons()
    })
  },
  { deep: true }
)

watch(
  () => props.isStreaming,
  (val) => {
    if (!val) {
      nextTick(() => {
        highlightCode()
        syncLucideIcons()
      })
    }
  }
)

onMounted(() => {
  syncLucideIcons()
  nextTick(() => {
    textareaRef.value?.focus()
    autoResize()
  })
})

onUpdated(syncLucideIcons)

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const sendMessage = () => {
  if (!inputVal.value.trim() || props.isStreaming) return
  emit('send', { text: inputVal.value })
  inputVal.value = ''
  nextTick(() => {
    textareaRef.value?.focus()
  })
}

const renderMarkdown = (text: string) => {
  if (!text) return ''
  const marked = (window as any)?.marked
  if (marked) {
    try {
      return marked.parse(text, { breaks: true, gfm: true })
    } catch (error) {
      console.warn('Markdown 渲染失败', error)
      return text
    }
  }
  return text
}

const shouldDisplayAsCode = (text: string) => {
  if (!text) return false
  const trimmed = text.trim()
  if (trimmed.includes('```markdown') || trimmed.includes('```md')) {
    return true
  }
  if (!trimmed.startsWith('```')) return false
  const lastFence = trimmed.lastIndexOf('```')
  if (lastFence <= 0) return false
  return lastFence === trimmed.length - 3
}

const hasContent = (msg: PlaygroundMessage) => {
  const content = msg.displayText || msg.text
  return Boolean(content && content.trim().length)
}
</script>
