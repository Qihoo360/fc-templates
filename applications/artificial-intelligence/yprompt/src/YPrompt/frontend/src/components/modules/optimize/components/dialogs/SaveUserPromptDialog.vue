<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" @click.stop>
      <!-- 头部 -->
      <div class="flex items-center justify-between p-6 border-b">
        <h2 class="text-xl font-semibold text-gray-900">保存用户提示词</h2>
        <button @click="handleCancel" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 内容 -->
      <div class="p-6 space-y-4">
        <!-- 标题 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            标题 <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.title"
            type="text"
            placeholder="请输入提示词标题"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxlength="200"
          />
          <p class="mt-1 text-xs text-gray-500">{{ formData.title.length }}/200</p>
        </div>

        <!-- 描述 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            描述
          </label>
          <textarea
            v-model="formData.description"
            placeholder="简短描述这个提示词的用途（可选）"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            maxlength="500"
          ></textarea>
          <p class="mt-1 text-xs text-gray-500">{{ formData.description.length }}/500</p>
        </div>

        <!-- 系统提示词（AI助手的角色设定） -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <span>系统提示词（AI助手角色）</span>
            <span v-if="formData.systemPrompt.trim()" class="flex items-center gap-1 text-green-600 text-xs">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              系统提示词已设置
            </span>
            <span v-else class="flex items-center gap-1 text-gray-400 text-xs">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              设置系统提示词（可选）
            </span>
          </label>
          <textarea
            v-model="formData.systemPrompt"
            placeholder="输入AI助手的系统提示词（可选）"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
            maxlength="5000"
          ></textarea>
          <p class="mt-1 text-xs text-gray-500">{{ formData.systemPrompt.length }}/5000 字符</p>
        </div>

        <!-- 对话上下文 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            对话上下文
            <span class="text-xs text-gray-500 ml-2">(严格JSON格式，可将来复用)</span>
          </label>
          <textarea
            v-model="formData.conversationHistory"
            placeholder='请输入对话历史，格式：[{"role":"user","content":"..."},{"role":"assistant","content":"..."}]'
            rows="6"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-xs"
            :class="{ 'border-red-500': conversationFormatError }"
          ></textarea>
          <p v-if="conversationFormatError" class="mt-1 text-xs text-red-600">
            ⚠️ JSON格式错误：{{ conversationFormatError }}
          </p>
          <p v-else class="mt-1 text-xs text-gray-500">
            {{ formData.conversationHistory.length }}/10000 字符
            <button 
              v-if="formData.conversationHistory" 
              @click="formatConversationJson"
              class="ml-2 text-blue-600 hover:text-blue-700 underline"
            >
              格式化
            </button>
            <button 
              @click="showConversationHelp = !showConversationHelp"
              class="ml-2 text-blue-600 hover:text-blue-700 underline"
            >
              {{ showConversationHelp ? '隐藏' : '查看' }}示例
            </button>
          </p>
          
          <!-- 对话格式帮助示例 -->
          <div v-if="showConversationHelp" class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
            <p class="font-semibold mb-1">标准格式示例：</p>
            <pre class="bg-white p-2 rounded overflow-x-auto">{{ conversationExample }}</pre>
          </div>
        </div>

        <!-- 标签 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            标签
          </label>
          <div class="flex flex-wrap gap-2 mb-2">
            <span
              v-for="tag in formData.tags"
              :key="tag"
              class="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
            >
              {{ tag }}
              <button @click="removeTag(tag)" class="ml-2 text-blue-500 hover:text-blue-700">×</button>
            </span>
          </div>
          <div class="flex gap-2">
            <input
              v-model="newTag"
              type="text"
              placeholder="输入标签后按回车添加"
              @keyup.enter="addTag"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              @click="addTag"
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              添加
            </button>
          </div>
        </div>

        <!-- 是否公开 -->
        <div class="flex items-center">
          <input
            v-model="formData.isPublic"
            type="checkbox"
            id="isPublic"
            class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label for="isPublic" class="ml-2 text-sm text-gray-700">
            公开分享（其他用户可以看到完整的系统提示词和对话记录）
          </label>
        </div>

        <!-- 用户提示词内容（优化后的） -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            用户提示词内容 <span class="text-red-500">*</span>
          </label>
          <div class="p-3 bg-gray-50 border border-gray-200 rounded-lg max-h-40 overflow-y-auto text-sm text-gray-600 font-mono">
            {{ promptContent.slice(0, 200) }}{{ promptContent.length > 200 ? '...' : '' }}
          </div>
          <p class="mt-1 text-xs text-gray-500">共 {{ promptContent.length }} 个字符</p>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="flex justify-end gap-3 p-6 border-t bg-gray-50">
        <button
          @click="handleCancel"
          class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          取消
        </button>
        <button
          @click="handleSave"
          :disabled="!canSave || isSaving"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          <span v-if="isSaving" class="flex items-center">
            <svg class="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            保存中...
          </span>
          <span v-else>保存</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const props = defineProps<{
  isOpen: boolean
  promptContent: string
  systemPrompt?: string
  conversationHistory?: string
  isSaving: boolean
}>()

const emit = defineEmits<{
  save: [data: {
    title: string
    description: string
    tags: string[]
    isPublic: boolean
    systemPrompt: string
    conversationHistory: string
  }]
  cancel: []
}>()

const formData = ref({
  title: '',
  description: '',
  systemPrompt: '',
  conversationHistory: '',
  tags: ['用户提示词', '快速优化'] as string[],
  isPublic: false
})

const newTag = ref('')
const showConversationHelp = ref(false)
const conversationFormatError = ref('')

// 对话格式示例
const conversationExample = `[
  {
    "role": "user",
    "content": "我牙疼"
  },
  {
    "role": "assistant",
    "content": "牙疼多久了？有什么特别的症状吗？"
  },
  {
    "role": "user",
    "content": "三天了，主要是吃冷热食物时特别疼"
  }
]`

// 验证对话历史JSON格式
const validateConversationJson = (jsonStr: string): string => {
  if (!jsonStr.trim()) return ''
  
  try {
    const parsed = JSON.parse(jsonStr)
    
    // 检查是否是数组
    if (!Array.isArray(parsed)) {
      return '必须是数组格式'
    }
    
    // 检查每个元素格式
    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i]
      if (!item.role || !item.content) {
        return `第${i + 1}条消息缺少role或content字段`
      }
      if (!['user', 'assistant', 'system'].includes(item.role)) {
        return `第${i + 1}条消息的role必须是user、assistant或system`
      }
    }
    
    return ''
  } catch (e: any) {
    return e.message || 'JSON格式错误'
  }
}

// 监听对话历史输入，实时验证格式
watch(() => formData.value.conversationHistory, (newValue) => {
  conversationFormatError.value = validateConversationJson(newValue)
})

// 格式化JSON
const formatConversationJson = () => {
  try {
    const parsed = JSON.parse(formData.value.conversationHistory)
    formData.value.conversationHistory = JSON.stringify(parsed, null, 2)
    conversationFormatError.value = ''
  } catch (e) {
    conversationFormatError.value = 'JSON格式错误，无法格式化'
  }
}

// 是否可以保存
const canSave = computed(() => {
  return formData.value.title.trim() && 
         props.promptContent && 
         !conversationFormatError.value
})

// 监听对话框打开，重置表单
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    // 自动生成标题
    const promptPreview = props.promptContent.substring(0, 50)
    formData.value.title = `用户提示词 - ${promptPreview}${props.promptContent.length > 50 ? '...' : ''}`
    
    formData.value.description = ''
    formData.value.systemPrompt = props.systemPrompt || ''
    formData.value.conversationHistory = props.conversationHistory || ''
    formData.value.tags = ['用户提示词', '快速优化']
    formData.value.isPublic = false
    conversationFormatError.value = ''
    showConversationHelp.value = false
  }
})

const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !formData.value.tags.includes(tag) && formData.value.tags.length < 10) {
    formData.value.tags.push(tag)
    newTag.value = ''
  }
}

const removeTag = (tag: string) => {
  formData.value.tags = formData.value.tags.filter(t => t !== tag)
}

const handleSave = () => {
  if (!canSave.value) return
  
  emit('save', {
    title: formData.value.title.trim(),
    description: formData.value.description.trim(),
    tags: formData.value.tags,
    isPublic: formData.value.isPublic,
    systemPrompt: formData.value.systemPrompt.trim(),
    conversationHistory: formData.value.conversationHistory.trim()
  })
}

const handleCancel = () => {
  emit('cancel')
}
</script>
