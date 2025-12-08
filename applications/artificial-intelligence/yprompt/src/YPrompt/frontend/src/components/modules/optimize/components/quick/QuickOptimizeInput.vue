<template>
  <div class="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <!-- 标题栏 -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
      <div class="flex justify-between items-center">
        <h2 class="font-semibold text-gray-800 dark:text-white">构建对话上下文</h2>
        <div class="flex items-center space-x-3">
          <button
            @click="showSystemPromptModal = true"
            class="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-sm"
            :class="systemPromptValue.trim() ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'"
            :title="systemPromptValue.trim() ? '系统提示词已设置' : '设置系统提示词'"
          >
            <FileText class="w-4 h-4" />
            <span>{{ systemPromptValue.trim() ? '系统提示词已设置' : '设置系统提示词' }}</span>
          </button>
          <button
            @click="handleRestart"
            class="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            title="重新开始"
          >
            <RefreshCw class="w-4 h-4" />
            <span>重新开始</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 对话消息列表 -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
      <!-- 消息卡片 -->
      <div
        v-for="message in messages.state.messages"
        :key="message.id"
        class="flex group"
        :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <div class="flex flex-col w-full" :class="message.isEditing ? 'max-w-full sm:max-w-2xl' : 'max-w-xs lg:max-w-md'">
          <div class="flex gap-2" :class="[message.role === 'user' ? 'flex-row-reverse' : 'flex-row', message.isEditing && 'items-start']">
            <!-- 头像 -->
            <div class="flex-shrink-0" v-if="!message.isEditing">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                :class="message.role === 'user' 
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' 
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'">
                {{ message.role === 'user' ? '👤' : '🤖' }}
              </div>
            </div>

            <!-- 消息内容 -->
            <div class="flex flex-col w-full">
              <!-- 编辑状态 -->
              <div v-if="message.isEditing" class="relative">
                <div class="relative border border-blue-300 rounded-2xl overflow-hidden bg-white dark:bg-gray-800">
                  <div class="relative">
                    <textarea
                      :value="message.content"
                      @input="messages.updateMessage(message.id, ($event.target as HTMLTextAreaElement).value)"
                      @keydown="handleEditKeydown($event, message.id)"
                      class="w-full p-4 border-0 resize-none focus:outline-none text-gray-800 dark:text-white bg-white dark:bg-gray-800 min-h-[80px] max-h-[200px] overflow-y-auto text-base"
                      placeholder="编辑消息内容..."
                    ></textarea>
                  </div>
                </div>
              </div>
              
              <!-- 正常显示状态 -->
              <div v-else
                class="rounded-lg px-4 py-3 transition-all duration-300"
                :class="[
                  message.role === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white',
                  message.role === 'user' ? 'ml-auto' : 'mr-auto'
                ]"
              >
                <div
                  v-if="!message.content"
                  class="text-sm opacity-50"
                >
                  {{ message.role === 'ai' ? '输入AI助手的回复...' : '输入你的消息...' }}
                </div>
                <div
                  v-else
                  class="text-sm whitespace-pre-wrap break-words"
                >
                  {{ message.content }}
                </div>
              </div>
              
              <!-- 操作按钮 -->
              <div 
                class="flex space-x-1 mt-2 transition-opacity duration-200"
                :class="[
                  message.isEditing ? 'opacity-100 justify-end' : 'opacity-0 group-hover:opacity-100 ' + (message.role === 'user' ? 'justify-end' : 'justify-start')
                ]"
              >
                <template v-if="message.isEditing">
                  <button
                    @click="messages.cancelEdit(message.id)"
                    class="p-1.5 text-gray-500 hover:text-red-600 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="取消编辑"
                  >
                    <X class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="messages.cancelEdit(message.id); saveMessageData()"
                    class="p-1.5 text-gray-500 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="保存"
                  >
                    <Check class="w-3.5 h-3.5" />
                  </button>
                </template>
                <template v-else>
                  <button
                    @click="messages.startEdit(message.id)"
                    class="p-1.5 text-gray-500 hover:text-green-600 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="编辑消息"
                  >
                    <Edit2 class="w-3.5 h-3.5" />
                  </button>
                  
                  <button
                    @click="messages.updateMessageRole(message.id, message.role === 'user' ? 'ai' : 'user'); saveMessageData()"
                    class="p-1.5 text-gray-500 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    :title="message.role === 'user' ? '切换为AI助手' : '切换为用户'"
                  >
                    <ArrowLeftRight class="w-3.5 h-3.5" />
                  </button>
                  
                  <button
                    @click="messages.removeMessage(message.id); saveMessageData()"
                    class="p-1.5 text-gray-500 hover:text-red-600 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="删除消息"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                  
                  <button
                    @click="copyMessage(message.content)"
                    class="p-1.5 text-gray-500 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="复制内容"
                  >
                    <Copy class="w-3.5 h-3.5" />
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="messages.state.messages.length === 0" class="flex items-center justify-center h-full text-center py-12">
        <div>
          <MessageSquare class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">暂无对话历史</p>
          <p class="text-xs text-gray-400 dark:text-gray-500">在下方输入框添加对话消息构建上下文</p>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0 rounded-b-lg">
      <!-- 角色选择 -->
      <div class="flex items-center gap-2 mb-2">
        <select
          v-model="currentRole"
          class="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="user">👤 用户</option>
          <option value="ai">🤖 AI助手</option>
        </select>
        <span class="text-xs text-gray-500 dark:text-gray-400">
          {{ currentRole === 'user' ? '以用户身份发送消息' : '以AI助手身份发送消息' }}
        </span>
      </div>

      <!-- 输入框 -->
      <div 
        class="relative border border-gray-300 dark:border-gray-600 rounded-2xl focus-within:outline-none focus-within:border-gray-300 overflow-hidden" 
        style="height: 120px;"
      >
        <div class="absolute top-0 left-0 right-0" style="bottom: 48px;">
          <textarea
            v-model="inputText"
            @keydown="handleKeydown"
            placeholder="输入消息内容 (Shift+Enter换行)"
            class="w-full h-full px-4 pt-3 pb-1 border-0 outline-none resize-none text-base overflow-y-auto bg-transparent text-gray-800 dark:text-white"
            rows="1"
          ></textarea>
        </div>
        
        <div class="absolute bottom-0 left-0 right-0 h-12 flex justify-between items-center px-2 bg-transparent">
          <div class="text-xs text-gray-500 dark:text-gray-400 ml-2">
            {{ inputText.length }} 字
            <span v-if="inputText.length > 0" class="ml-2 text-blue-600 dark:text-blue-400">
              · {{ getLengthCategory(inputText.length) }}
            </span>
          </div>
          
          <div class="flex gap-2">
            <button
              @click="addMessageToConversation"
              :disabled="!inputText.trim()"
              class="w-8 h-8 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              title="发送消息到对话历史"
            >
              <ArrowUp class="w-4 h-4" />
            </button>
            
            <button
              @click="handleOptimize"
              :disabled="messages.state.messages.length === 0 || isOptimizing"
              class="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white text-sm rounded-full transition-colors disabled:cursor-not-allowed"
              title="开始优化最后一条消息"
            >
              {{ isOptimizing ? '优化中...' : '优化' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 系统提示词模态框 -->
    <SystemPromptModal
      :is-open="showSystemPromptModal"
      v-model="systemPromptValue"
      @close="showSystemPromptModal = false"
      @save="handleSaveSystemPrompt"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ArrowUp, FileText, MessageSquare, RefreshCw, ArrowLeftRight, Trash2, Copy, Edit2, X, Check } from 'lucide-vue-next'
import { copyToClipboard as copyUtil } from '@/utils/clipboardUtils'
import { useConversationMessages } from '../../composables/useConversationMessages'
import SystemPromptModal from './SystemPromptModal.vue'

const STORAGE_KEY = 'user_prompt_optimize_data'

const props = defineProps<{
  modelValue: string
  systemPrompt: string
  conversationHistory: string
  isOptimizing: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:systemPrompt': [value: string]
  'update:conversationHistory': [value: string]
  'optimize': []
  'restart': []
}>()

const messages = useConversationMessages()
const showSystemPromptModal = ref(false)
const systemPromptValue = ref(props.systemPrompt)
const currentRole = ref<'user' | 'ai'>('user')
const inputText = ref('')

// 从JSON格式的对话历史恢复消息
const loadFromConversationHistory = () => {
  if (props.conversationHistory.trim()) {
    try {
      const parsed = JSON.parse(props.conversationHistory)
      if (Array.isArray(parsed)) {
        messages.state.messages = parsed.map((msg, index) => ({
          id: `msg-${Date.now()}-${index}`,
          role: msg.role === 'assistant' ? 'ai' : 'user',
          content: msg.content,
          isEditing: false
        }))
        
        // 如果有modelValue(草稿提示词),添加为最后一条消息
        if (props.modelValue.trim()) {
          messages.addMessage('user')
          const lastMsg = messages.state.messages[messages.state.messages.length - 1]
          messages.updateMessage(lastMsg.id, props.modelValue)
        }
      }
    } catch (e) {
      console.error('解析对话历史JSON失败:', e)
    }
  } else if (props.modelValue.trim()) {
    // 没有对话历史，但有草稿提示词
    messages.addMessage('user')
    const lastMsg = messages.state.messages[messages.state.messages.length - 1]
    messages.updateMessage(lastMsg.id, props.modelValue)
  }
}

// 加载保存的数据
onMounted(() => {
  // 检查是否正在从"我的"页面加载数据
  const isLoadingFromLibrary = localStorage.getItem('yprompt_optimize_loaded_user_prompt')
  
  // 如果正在从库加载，跳过本地编辑数据的加载，等待父组件设置props
  if (isLoadingFromLibrary) {
    console.log('🔵 检测到从库加载数据，跳过本地编辑数据加载')
    return
  }
  
  // 否则加载上次编辑的数据
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      if (data.messages) {
        messages.state.messages = data.messages
      }
      if (data.systemPrompt) {
        systemPromptValue.value = data.systemPrompt
        emit('update:systemPrompt', data.systemPrompt)
      }
      console.log('🟢 已加载上次编辑的数据')
    }
  } catch (e) {
    console.error('加载保存数据失败:', e)
  }
})

// 监听props变化，从"我的"页面加载时
// 使用一个标志来防止内部更新触发重新加载
let isInternalUpdate = false

// 监听conversationHistory变化
watch(() => props.conversationHistory, (newVal, oldVal) => {
  // 只有在非内部更新且值真正改变时才重新加载
  if (!isInternalUpdate && newVal !== oldVal) {
    console.log('🔵 检测到conversationHistory变化，准备加载:', newVal?.substring(0, 50))
    loadFromConversationHistory()
  }
})

// 监听draftPrompt(modelValue)变化
watch(() => props.modelValue, (newVal, oldVal) => {
  // 当draftPrompt变化且conversationHistory为空时，也要加载
  if (!isInternalUpdate && newVal !== oldVal && newVal?.trim() && !props.conversationHistory?.trim()) {
    console.log('🔵 检测到draftPrompt变化(无对话历史)，准备加载:', newVal.substring(0, 50))
    loadFromConversationHistory()
  }
})

// 保存数据到localStorage
const saveMessageData = () => {
  try {
    const data = {
      messages: messages.state.messages,
      systemPrompt: systemPromptValue.value
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('保存数据失败:', e)
  }
}

watch(() => props.systemPrompt, (newVal) => {
  systemPromptValue.value = newVal
})

watch(() => messages.state.messages, () => {
  // 设置标志,表示这是内部更新
  isInternalUpdate = true
  
  // 对话历史：前n-1条消息（排除最后一条，因为最后一条是要优化的草稿）
  // 使用标准JSON格式存储
  if (messages.state.messages.length > 1) {
    const contextMessages = messages.state.messages.slice(0, -1)
    const jsonMessages = contextMessages
      .filter(msg => msg.content.trim())
      .map(msg => ({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.content
      }))
    emit('update:conversationHistory', JSON.stringify(jsonMessages, null, 2))
  } else {
    emit('update:conversationHistory', '')
  }
  
  // 更新modelValue为最后一条消息（要优化的草稿）
  if (messages.state.messages.length > 0) {
    const lastMessage = messages.state.messages[messages.state.messages.length - 1]
    emit('update:modelValue', lastMessage.content)
  } else {
    emit('update:modelValue', '')
  }
  
  saveMessageData()
  
  // 在下一个tick重置标志
  setTimeout(() => {
    isInternalUpdate = false
  }, 0)
}, { deep: true })

const addMessageToConversation = () => {
  if (!inputText.value.trim()) return
  
  // 使用当前选择的角色添加消息
  const roleToAdd = currentRole.value
  messages.addMessage(roleToAdd)
  const lastMessage = messages.state.messages[messages.state.messages.length - 1]
  messages.updateMessage(lastMessage.id, inputText.value)
  
  inputText.value = ''
  
  // 发送后自动切换回用户角色（可选，根据用户习惯调整）
  // currentRole.value = 'user'
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && event.shiftKey) {
    return
  }
  
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    addMessageToConversation()
  }
}

const handleEditKeydown = (event: KeyboardEvent, messageId: string) => {
  if (event.key === 'Enter' && event.shiftKey) {
    return
  }
  
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    messages.cancelEdit(messageId)
    saveMessageData()
  }
  
  if (event.key === 'Escape') {
    messages.cancelEdit(messageId)
  }
}

const handleOptimize = () => {
  if (messages.state.messages.length === 0 || props.isOptimizing) return
  emit('optimize')
}

const handleRestart = () => {
  if (confirm('确定要重新开始吗？这将清除所有对话历史、系统提示词和优化结果。')) {
    // 清空所有数据
    messages.reset()
    inputText.value = ''
    systemPromptValue.value = ''
    
    // 通知父组件清除
    emit('update:modelValue', '')
    emit('update:systemPrompt', '')
    emit('update:conversationHistory', '')
    emit('restart')
    
    // 清空localStorage
    localStorage.removeItem(STORAGE_KEY)
  }
}

const handleSaveSystemPrompt = () => {
  emit('update:systemPrompt', systemPromptValue.value)
  saveMessageData()
}

const copyMessage = async (content: string) => {
  try {
    await copyUtil(content)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

const getLengthCategory = (length: number): string => {
  if (length <= 20) return '短草稿'
  if (length <= 100) return '中等草稿'
  if (length <= 300) return '长草稿'
  return '超长草稿'
}
</script>
