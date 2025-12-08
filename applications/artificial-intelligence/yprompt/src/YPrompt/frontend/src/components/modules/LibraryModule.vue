<template>
  <div class="h-full flex flex-col overflow-hidden p-2">
    <!-- 模块特定顶栏（整合用户信息和搜索功能） -->
    <div class="bg-white rounded-lg shadow-sm p-6 mb-4 flex-shrink-0">
      <!-- 主要内容区域：用户信息和搜索 -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <!-- 用户信息区域 -->
        <div v-if="authStore.isLoggedIn" class="flex items-center gap-4">
          <!-- 头像 -->
          <div class="relative">
            <img 
              v-if="authStore.user?.avatar" 
              :src="authStore.user.avatar" 
              :alt="authStore.user?.name"
              class="w-14 h-14 rounded-full border-2 border-blue-500 shadow-md object-cover"
            />
            <div v-else class="w-14 h-14 rounded-full border-2 border-gray-300 bg-gray-100 flex items-center justify-center">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <!-- 在线状态指示器 -->
            <div class="absolute bottom-0 right-0 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          
          <!-- 用户详情 -->
          <div class="min-w-0">
            <h2 class="text-xl font-bold text-gray-900">{{ authStore.user?.name || '用户' }}</h2>
            <div class="flex items-center gap-3 text-sm text-gray-600 mt-1">
              <span v-if="authStore.user?.email" class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {{ authStore.user.email }}
              </span>
              <span v-if="authStore.user?.id" class="flex items-center gap-1">
                ID: {{ authStore.user?.id }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- 未登录提示 -->
        <div v-else class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-full border-2 border-gray-300 bg-gray-100 flex items-center justify-center">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-900">未登录</h2>
            <p class="text-sm text-gray-600">请先登录以管理您的提示词</p>
          </div>
        </div>
        
        <!-- 搜索和操作区域 -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <!-- 搜索框 -->
          <div class="relative">
            <span class="absolute left-3.5 top-2.5 text-gray-400">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索提示词..."
              class="w-80 pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none"
              @input="handleSearch"
            />
          </div>
          
          <!-- 操作按钮组 -->
          <div class="flex items-center gap-3">
            <!-- 新建按钮 -->
            <button
              @click="showCreateDialog = true"
              class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap text-sm font-medium"
            >
              <span>新建提示词</span>
            </button>
            
            <!-- 系统按钮组 -->
            <div class="flex items-center gap-1 p-1 bg-gray-50 rounded-lg">
              <button 
                v-if="authStore.isLoggedIn"
                @click="handleLogout"
                class="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors font-medium"
                title="登出"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 内容区域 -->
    <div class="flex-1 bg-white rounded-lg shadow-sm overflow-hidden">
      <!-- 已登录状态 -->
      <div v-if="authStore.isLoggedIn" class="h-full flex flex-col">
        <!-- 提示词列表 -->
        <PromptList 
          ref="promptListRef"
          @create-prompt="showCreateDialog = true"
        />
        
        <!-- 新建提示词对话框 -->
        <SavePromptDialog
          :is-open="showCreateDialog"
          :prompt-content="newPromptContent"
          :is-saving="isSaving"
          @save="handleCreatePrompt"
          @cancel="showCreateDialog = false"
        />
      </div>
      
      <!-- 未登录状态 -->
      <div v-else class="h-full flex items-center justify-center">
        <div class="text-center max-w-md px-6">
          <svg class="w-16 h-16 mb-4 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">请先登录</h2>
          <p class="text-gray-600">
            登录后即可访问您的个人提示词库
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import { ref, provide } from 'vue'
import PromptList from './library/components/PromptList.vue'
import SavePromptDialog from '@/components/preview/components/dialogs/SavePromptDialog.vue'

const authStore = useAuthStore()

// API配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// 新建提示词状态
const showCreateDialog = ref(false)
const newPromptContent = ref('')
const isSaving = ref(false)

// 搜索状态
const searchKeyword = ref('')

// PromptList ref
const promptListRef = ref()

// 防抖定时器
let searchTimer: NodeJS.Timeout | null = null

// provide搜索功能给子组件
provide('searchKeyword', searchKeyword)

// 搜索处理（防抖）
const handleSearch = () => {
  // 清除之前的定时器
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  
  // 设置新的定时器，500ms后执行搜索
  searchTimer = setTimeout(() => {
    // 通过ref调用子组件的搜索方法
    if (promptListRef.value) {
      promptListRef.value.searchWithKeyword(searchKeyword.value)
    }
  }, 500)
}

// 创建提示词
const handleCreatePrompt = async (formData: {
  title: string
  description: string
  tags: string[]
  isPublic: boolean
  promptType: string
  content?: string
}) => {
  try {
    isSaving.value = true
    const token = localStorage.getItem('yprompt_token')
    if (!token) {
      throw new Error('请先登录')
    }

    const response = await fetch(`${API_BASE_URL}/api/prompts/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: formData.title,
        description: formData.description,
        final_prompt: formData.content || newPromptContent.value,
        language: 'zh',
        format: 'markdown',
        prompt_type: formData.promptType,
        tags: formData.tags,
        is_public: formData.isPublic ? 1 : 0
      })
    })

    const result = await response.json()
    if (result.code === 200) {
      alert('提示词创建成功！')
      showCreateDialog.value = false
      newPromptContent.value = ''
      // 刷新列表（通过发出事件或重新加载）
      window.location.reload()
    } else {
      throw new Error(result.message || '创建失败')
    }
  } catch (err: any) {
    console.error('创建提示词失败:', err)
    alert(`创建失败: ${err.message}`)
  } finally {
    isSaving.value = false
  }
}

// 登出
const handleLogout = async () => {
  await authStore.logout()
}
</script>