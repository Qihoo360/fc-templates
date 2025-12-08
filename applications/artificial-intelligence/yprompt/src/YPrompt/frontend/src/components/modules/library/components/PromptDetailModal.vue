<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
    <div class="prompt-detail-modal bg-white rounded-lg shadow-xl w-full h-[90vh] max-w-6xl mx-4 overflow-hidden flex flex-col">
      <!-- 头部 -->
      <div class="flex items-start justify-between p-6 border-b bg-gray-50">
        <div class="flex-1 min-w-0">
          <!-- 编辑模式 -->
          <div v-if="isEditing" class="space-y-3">
            <div class="flex items-center gap-4">
              <!-- 标题输入 -->
              <div class="flex-1 min-w-0">
                <input
                  v-model="editedTitle"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-xl font-semibold text-gray-900"
                  placeholder="请输入标题"
                />
              </div>
              
              <!-- 编辑模式按钮 -->
              <div class="flex items-center gap-2 flex-shrink-0">
                <button
                  @click="handleCancelEdit"
                  class="px-3 py-1.5 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-1"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  取消
                </button>
                <button
                  @click="handleSaveEdit"
                  :disabled="isSaving"
                  class="px-3 py-1.5 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  <svg v-if="!isSaving" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  {{ isSaving ? '保存中...' : '保存' }}
                </button>
              </div>
            </div>
            
            <!-- 描述输入 -->
            <textarea
              v-model="editedDescription"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm text-gray-700 resize-none"
              rows="2"
              placeholder="请输入描述（可选）"
            ></textarea>
            
            <!-- 提示词设置：类型、可见性、标签（紧凑单行） -->
            <div class="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
              <!-- 类型 -->
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-medium text-gray-600">类型</span>
                <div class="flex gap-2">
                  <label class="flex items-center cursor-pointer group">
                    <input
                      v-model="editedPromptType"
                      type="radio"
                      value="system"
                      class="w-3.5 h-3.5 text-purple-600 border-gray-300 focus:ring-purple-500 focus:ring-1"
                    />
                    <span class="ml-1 text-xs text-gray-700 group-hover:text-purple-600">系统</span>
                  </label>
                  <label class="flex items-center cursor-pointer group">
                    <input
                      v-model="editedPromptType"
                      type="radio"
                      value="user"
                      class="w-3.5 h-3.5 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-1"
                    />
                    <span class="ml-1 text-xs text-gray-700 group-hover:text-blue-600">用户</span>
                  </label>
                </div>
              </div>
              
              <div class="w-px h-4 bg-gray-300"></div>
              
              <!-- 可见性 -->
              <label class="flex items-center cursor-pointer group">
                <input
                  v-model="editedIsPublic"
                  type="checkbox"
                  class="w-3.5 h-3.5 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-1"
                />
                <span class="ml-1 text-xs text-gray-700 group-hover:text-green-600">公开</span>
              </label>
              
              <div class="w-px h-4 bg-gray-300"></div>
              
              <!-- 标签 -->
              <div class="flex items-center gap-1.5 flex-1 min-w-0">
                <span class="text-xs font-medium text-gray-600 flex-shrink-0">标签</span>
                <!-- 已有标签 -->
                <div class="flex items-center gap-1 flex-wrap flex-1 min-w-0">
                  <span
                    v-for="(tag, index) in editedTags"
                    :key="index"
                    class="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors"
                  >
                    <span class="max-w-[80px] truncate">{{ tag }}</span>
                    <button
                      @click="removeTag(index)"
                      class="text-blue-600 hover:text-blue-800 font-bold text-sm leading-none"
                      title="移除标签"
                    >
                      ×
                    </button>
                  </span>
                  <!-- 添加按钮 -->
                  <button
                    v-if="editedTags.length < 5"
                    @click="showTagInput = !showTagInput"
                    class="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs rounded transition-colors"
                    title="添加标签"
                  >
                    <span>+</span>
                  </button>
                  <span v-else class="text-xs text-gray-400">(最多5个)</span>
                </div>
              </div>
            </div>
            
            <!-- 标签输入框（展开时显示） -->
            <div v-if="showTagInput" class="px-3">
              <div class="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <input
                  ref="tagInputRef"
                  v-model="tagInput"
                  type="text"
                  placeholder="输入标签名（最多8字）"
                  maxlength="8"
                  class="flex-1 px-2 py-1 border border-gray-300 rounded outline-none text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  @keydown.enter.prevent="addTag"
                  @keydown.esc="showTagInput = false"
                />
                <button
                  @click="addTag"
                  class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
                >
                  添加
                </button>
                <button
                  @click="showTagInput = false; tagInput = ''"
                  class="px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm rounded transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
          
          <!-- 查看模式 -->
          <div v-else>
            <div class="flex items-center gap-4">
              <!-- 标题和描述 -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h2 class="text-xl font-semibold text-gray-900 truncate">{{ prompt?.title }}</h2>
                  <!-- 提示词类型标签 -->
                  <span 
                    :class="prompt?.prompt_type === 'system' 
                      ? 'bg-purple-100 text-purple-700 border-purple-200' 
                      : 'bg-blue-100 text-blue-700 border-blue-200'"
                    class="px-2 py-0.5 text-xs font-medium rounded border flex-shrink-0"
                  >
                    {{ prompt?.prompt_type === 'system' ? '系统提示词' : '用户提示词' }}
                  </span>
                </div>
                <p v-if="prompt?.description" class="text-sm text-gray-600 mt-1 truncate">{{ prompt.description }}</p>
              </div>
              
              <!-- 查看模式按钮 -->
              <div class="flex items-center gap-2 flex-shrink-0">
                <button
                  @click="handleCopy"
                  class="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-1"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  复制
                </button>
                <button
                  @click="handleEdit"
                  data-edit="prompt-detail"
                  class="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-1"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  编辑
                </button>
                <button
                  v-if="prompt"
                  @click="$emit('optimize', prompt)"
                  class="px-3 py-1.5 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-1"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  优化
                </button>
              </div>
            </div>
          </div>
        </div>
        <button @click="handleClose" class="text-gray-400 hover:text-gray-600 ml-4">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 内容区域 -->
      <div v-if="prompt" class="flex-1 overflow-hidden flex flex-col">
        <!-- 统计信息栏（编辑模式时隐藏） -->
        <div v-if="!isEditing" class="px-6 py-3 bg-gray-50 border-b">
          <div class="flex items-center flex-wrap gap-4 text-sm text-gray-600">

            <span class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ prompt.is_public ? '公开' : '私有' }}
            </span>

            <span class="w-px h-4 bg-gray-300"></span>

            <span class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {{ prompt.view_count || 0 }}
            </span>

            <span class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {{ prompt.use_count || 0 }}
            </span>

            <span class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              v{{ prompt.current_version || '1.0.0' }}
            </span>

            <span class="flex items-center gap-1">
              <svg v-if="prompt.is_favorite" class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              {{ prompt.is_favorite ? '已收藏' : '未收藏' }}
            </span>
            
            <span class="w-px h-4 bg-gray-300"></span>
            
            <!-- 标签（仅查看模式显示） -->
            <div class="flex items-center gap-2">
              <span>标签:</span>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="tag in prompt.tags"
                  :key="tag"
                  class="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                >
                  {{ tag }}
                </span>
                <span v-if="prompt.tags.length === 0" class="text-xs text-gray-500">暂无标签</span>
              </div>
            </div>
            
          </div>
        </div>

        <!-- 标签页 -->
        <div class="flex-1 overflow-hidden flex flex-col">
          <!-- 标签栏 -->
          <div class="flex border-b">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              @click="activeTab = tab.key"
              :class="[
                'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === tab.key 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              ]"
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- 标签内容 -->
          <div class="flex-1 overflow-y-auto p-6">
            <!-- 提示词内容 -->
            <div v-if="activeTab === 'content'" class="h-full">
              <!-- 编辑模式 -->
              <textarea
                v-if="isEditing"
                v-model="editedContent"
                class="w-full h-full p-4 outline-none resize-none text-sm text-gray-800 font-mono bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200"
                placeholder="请输入提示词内容..."
              ></textarea>
              <!-- 查看模式 -->
              <pre v-else class="h-full p-4 whitespace-pre-wrap text-sm text-gray-800 font-mono overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">{{ prompt.final_prompt }}</pre>
            </div>

            <!-- 基本信息 -->
            <div v-if="activeTab === 'info'" class="space-y-4">
              <div>
                <dl class="space-y-3">
                  <div class="flex">
                    <dt class="w-32 text-sm font-medium text-gray-600">标题:</dt>
                    <dd class="text-sm text-gray-900">{{ prompt.title }}</dd>
                  </div>
                  <div class="flex">
                    <dt class="w-32 text-sm font-medium text-gray-600">描述:</dt>
                    <dd class="text-sm text-gray-900">{{ prompt.description || '暂无描述' }}</dd>
                  </div>
                  <div class="flex">
                    <dt class="w-32 text-sm font-medium text-gray-600">语言:</dt>
                    <dd class="text-sm text-gray-900">{{ prompt.language === 'zh' ? '中文' : '英文' }}</dd>
                  </div>
                  <div class="flex">
                    <dt class="w-32 text-sm font-medium text-gray-600">格式:</dt>
                    <dd class="text-sm text-gray-900">{{ prompt.format }}</dd>
                  </div>
                  <div class="flex">
                    <dt class="w-32 text-sm font-medium text-gray-600">字符数:</dt>
                    <dd class="text-sm text-gray-900">{{ prompt.final_prompt.length }}</dd>
                  </div>
                  <div class="flex">
                    <dt class="w-32 text-sm font-medium text-gray-600">创建时间:</dt>
                    <dd class="text-sm text-gray-900">{{ formatDateTime(prompt.create_time) }}</dd>
                  </div>
                  <div class="flex">
                    <dt class="w-32 text-sm font-medium text-gray-600">更新时间:</dt>
                    <dd class="text-sm text-gray-900">{{ formatDateTime(prompt.update_time) }}</dd>
                  </div>
                  
                  <!-- 用户提示词特有字段 -->
                  <template v-if="prompt.prompt_type === 'user'">
                    <div class="pt-3 border-t border-gray-200">
                      <dt class="text-sm font-medium text-gray-600 mb-2">系统提示词:</dt>
                      <dd class="text-sm text-gray-900">
                        <pre v-if="prompt.system_prompt" class="p-3 bg-gray-50 rounded border border-gray-200 whitespace-pre-wrap font-mono text-xs">{{ prompt.system_prompt }}</pre>
                        <span v-else class="text-gray-400 italic">未设置</span>
                      </dd>
                    </div>
                    <div class="pt-3 border-t border-gray-200">
                      <dt class="text-sm font-medium text-gray-600 mb-2">对话上下文:</dt>
                      <dd class="text-sm text-gray-900">
                        <pre v-if="prompt.conversation_history" class="p-3 bg-gray-50 rounded border border-gray-200 whitespace-pre-wrap font-mono text-xs">{{ prompt.conversation_history }}</pre>
                        <span v-else class="text-gray-400 italic">未设置</span>
                      </dd>
                    </div>
                  </template>
                </dl>
              </div>
            </div>

            <!-- 版本历史 -->
            <div v-if="activeTab === 'versions'" class="h-full">
              <VersionHistoryContent
                v-if="prompt"
                :prompt-id="prompt.id"
                @rollback="(versionNumber) => emit('rollback', versionNumber)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { copyToClipboard as copyUtil } from '@/utils/clipboardUtils'
import VersionHistoryContent from './VersionHistoryContent.vue'

// API配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

interface Prompt {
  id: number
  title: string
  description: string
  final_prompt: string
  prompt_type: string
  tags: string[]
  is_favorite: number | boolean  // 兼容后端返回的数字类型
  is_public: number | boolean  // 兼容后端返回的数字类型
  view_count: number
  use_count: number
  current_version: string
  language: string
  format: string
  create_time: string
  update_time: string
  system_prompt?: string  // 系统提示词（用户提示词专用）
  conversation_history?: string  // 对话上下文（用户提示词专用）
}

const props = defineProps<{
  prompt: Prompt | null
}>()

const emit = defineEmits<{
  close: []
  edit: [prompt: Prompt]
  optimize: [prompt: Prompt]
  rollback: [versionNumber: string]
}>()

const isOpen = computed(() => !!props.prompt)
const activeTab = ref('content')
const isEditing = ref(false)
const editedContent = ref('')
const editedTitle = ref('')
const editedDescription = ref('')
const editedPromptType = ref('system')
const editedIsPublic = ref(false)
const editedTags = ref<string[]>([])
const tagInput = ref('')
const showTagInput = ref(false)
const tagInputRef = ref<HTMLInputElement>()
const isSaving = ref(false)
const shouldStartEditing = ref(false)

const tabs = [
  { key: 'content', label: '提示词内容' },
  { key: 'info', label: '基本信息' },
  { key: 'versions', label: '版本历史' }
]

// 关闭弹窗
const handleClose = () => {
  isEditing.value = false
  emit('close')
  activeTab.value = 'content'
}

// 开始编辑
const handleEdit = () => {
  if (!props.prompt) return
  editedContent.value = props.prompt.final_prompt
  editedTitle.value = props.prompt.title
  editedDescription.value = props.prompt.description || ''
  editedPromptType.value = props.prompt.prompt_type || 'system'
  editedIsPublic.value = !!props.prompt.is_public
  editedTags.value = [...props.prompt.tags]
  isEditing.value = true
}

// 取消编辑
const handleCancelEdit = () => {
  isEditing.value = false
  editedContent.value = ''
  editedTitle.value = ''
  editedDescription.value = ''
  editedPromptType.value = 'system'
  editedIsPublic.value = false
  editedTags.value = []
  tagInput.value = ''
  showTagInput.value = false
}

// 添加标签
const addTag = () => {
  const tag = tagInput.value.trim()
  
  // 验证：非空
  if (!tag) {
    return
  }
  
  // 验证：最多5个标签
  if (editedTags.value.length >= 5) {
    alert('最多只能添加5个标签')
    return
  }
  
  // 验证：标签不重复
  if (editedTags.value.includes(tag)) {
    alert('标签已存在')
    tagInput.value = ''
    return
  }
  
  // 验证：最多8个字符
  if (tag.length > 8) {
    alert('标签最多8个字符')
    return
  }
  
  // 添加标签
  editedTags.value.push(tag)
  tagInput.value = ''
  showTagInput.value = false
}

// 移除标签
const removeTag = (index: number) => {
  editedTags.value.splice(index, 1)
}

// 监听标签输入框显示状态，自动聚焦
watch(showTagInput, async (show) => {
  if (show) {
    await nextTick()
    tagInputRef.value?.focus()
  }
})

// 保存编辑
const handleSaveEdit = async () => {
  if (!props.prompt) return
  
  try {
    isSaving.value = true
    const token = localStorage.getItem('yprompt_token')
    if (!token) {
      throw new Error('请先登录')
    }

    const response = await fetch(`${API_BASE_URL}/api/prompts/${props.prompt.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: editedTitle.value.trim(),
        description: editedDescription.value.trim(),
        final_prompt: editedContent.value,
        prompt_type: editedPromptType.value,
        is_public: editedIsPublic.value ? 1 : 0,
        tags: editedTags.value
      })
    })

    const result = await response.json()
    if (result.code === 200) {
      alert('保存成功')
      isEditing.value = false
      // 更新本地数据
      if (props.prompt) {
        props.prompt.title = editedTitle.value.trim()
        props.prompt.description = editedDescription.value.trim()
        props.prompt.final_prompt = editedContent.value
        props.prompt.prompt_type = editedPromptType.value
        props.prompt.is_public = editedIsPublic.value ? 1 : 0
        props.prompt.tags = editedTags.value
      }
      // 通知父组件刷新列表
      emit('edit', props.prompt)
    } else {
      throw new Error(result.message || '保存失败')
    }
  } catch (err: any) {
    console.error('保存失败:', err)
    alert(`保存失败: ${err.message}`)
  } finally {
    isSaving.value = false
  }
}

// 复制提示词
const handleCopy = async () => {
  if (!props.prompt) return
  
  try {
    await copyUtil(props.prompt.final_prompt)
    // 这里可以显示一个toast提示
    alert('提示词已复制到剪贴板')
  } catch (err) {
    console.error('复制失败:', err)
    alert('复制失败')
  }
}

// 格式化日期时间
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 暴露startEdit方法给父组件
const startEdit = () => {
  shouldStartEditing.value = true
}

// 监听prompt变化，如果需要开始编辑
watch(() => props.prompt, () => {
  if (props.prompt && shouldStartEditing.value) {
    nextTick(() => {
      handleEdit()
      shouldStartEditing.value = false
    })
  }
})

// 暴露方法
defineExpose({
  startEdit
})
</script>