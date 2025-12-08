<template>
  <div class="h-full flex flex-col">
    <!-- 提示词列表 -->
    <div class="flex-1 overflow-y-auto p-4">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="flex items-center justify-center h-32">
        <div class="flex items-center gap-2 text-gray-500">
          <div class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span>加载中...</span>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="prompts.length === 0" class="flex flex-col items-center justify-center h-64 text-center">
        <svg class="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="text-lg font-semibold text-gray-800 mb-2">
          {{ searchKeyword || selectedTag ? '没有找到匹配的提示词' : '还没有保存的提示词' }}
        </h3>
        <p class="text-gray-600 mb-4">
          {{ searchKeyword || selectedTag ? '请尝试其他搜索条件' : '去生成页面创建您的第一个提示词吧！' }}
        </p>
        <router-link
          to="/generate"
          class="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          开始生成
        </router-link>
      </div>

      <!-- 提示词卡片列表 -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="prompt in prompts"
          :key="prompt.id"
          class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          @click="handleViewPrompt(prompt)"
        >
          <!-- 头部：标题和类型标签 -->
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-medium text-gray-900 truncate mb-1">{{ prompt.title }}</h3>
              <p class="text-sm text-gray-600 line-clamp-2 h-10">{{ prompt.description || '暂无描述' }}</p>
            </div>
            <!-- 提示词类型标签（固定右端） -->
            <span 
              :class="prompt.prompt_type === 'system' 
                ? 'bg-purple-100 text-purple-700 border-purple-200' 
                : 'bg-blue-100 text-blue-700 border-blue-200'"
              class="px-2 py-0.5 text-xs font-medium rounded border flex-shrink-0"
            >
              {{ prompt.prompt_type === 'system' ? '系统' : '用户' }}
            </span>
          </div>

          <!-- 内容预览 -->
          <div class="text-sm text-gray-700 mb-3 p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-md border border-gray-200">
            <div class="line-clamp-2 h-10 font-mono text-xs leading-relaxed">
              <span v-if="prompt.final_prompt">
                {{ prompt.final_prompt.slice(0, 150) }}{{ prompt.final_prompt.length > 150 ? '...' : '' }}
              </span>
              <span v-else class="text-gray-400 italic">
                暂无提示词内容
              </span>
            </div>
          </div>

          <!-- 底部：统计信息和操作按钮 -->
          <div class="flex items-center justify-between pt-2 border-t border-gray-100">
            <!-- 统计信息 -->
            <div class="flex items-center gap-3 text-xs text-gray-500">
              <span class="flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {{ prompt.view_count || 0 }}
              </span>
              <span class="flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {{ prompt.use_count || 0 }}
              </span>
              <span class="flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                v{{ prompt.current_version || '1.0.0' }}
              </span>
              <span class="text-gray-400">
                • {{ formatDate(prompt.update_time || prompt.create_time) }}
              </span>
            </div>

            <!-- 操作按钮 -->
            <div class="flex items-center gap-1">
              <!-- 复制按钮 -->
              <button
                @click.stop="handleCopyPrompt(prompt)"
                class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="复制"
              >
                <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              
              <!-- 更多操作 -->
              <div class="relative group">
                <button
                  @click.stop="showActionMenu[prompt.id] = !showActionMenu[prompt.id]"
                  class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  title="更多操作"
                >
                  <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                
                <!-- 下拉菜单 -->
                <div
                  v-if="showActionMenu[prompt.id]"
                  @click.stop
                  class="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
                >
                  <button
                    @click.stop="handleEditPrompt(prompt)"
                    class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    编辑
                  </button>
                  <button
                    @click.stop="handleOptimizePrompt(prompt)"
                    class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    优化
                  </button>
                  <button
                    @click.stop="handleShowVersionHistory(prompt)"
                    class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    版本历史
                  </button>
                  <button
                    @click.stop="handleDeletePrompt(prompt)"
                    class="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 标签 - 固定在底部 -->
          <div class="mt-3 pt-2 border-t border-gray-100">
            <div class="flex flex-wrap gap-1">
              <span
                v-for="tag in (prompt.tags || [])"
                :key="tag"
                class="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
              >
                {{ tag }}
              </span>
              <span v-if="!prompt.tags || prompt.tags.length === 0" class="text-xs text-gray-400">
                暂无标签
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="flex justify-center items-center gap-2 mt-6">
        <button
          @click="changePage(currentPage - 1)"
          :disabled="currentPage <= 1"
          class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          上一页
        </button>
        
        <span class="text-sm text-gray-600">
          第 {{ currentPage }} 页，共 {{ totalPages }} 页
        </span>
        
        <button
          @click="changePage(currentPage + 1)"
          :disabled="currentPage >= totalPages"
          class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          下一页
        </button>
      </div>
    </div>

    <!-- 提示词详情弹窗 -->
    <PromptDetailModal
      v-if="showDetailModal"
      :prompt="selectedPrompt"
      @close="showDetailModal = false"
      @edit="handlePromptUpdated"
      @optimize="handleOptimizePrompt"
      @rollback="handleVersionRollback"
    />

    <VersionHistoryPanel
      :is-open="showVersionHistory"
      :prompt-id="selectedPromptForVersion?.id || 0"
      @close="showVersionHistory = false"
      @rollback="handleVersionRollback"
    />

    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, inject, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNavigationStore } from '@/stores/navigationStore'
import { copyToClipboard as copyUtil } from '@/utils/clipboardUtils'
import PromptDetailModal from './PromptDetailModal.vue'
import VersionHistoryPanel from './VersionHistoryPanel.vue'

// 定义 emits
const emit = defineEmits<{
  'create-prompt': []
}>()

// 注入搜索关键词
const searchKeyword = inject('searchKeyword', ref(''))

// 防抖定时器（保留供将来使用）
// let searchTimer: NodeJS.Timeout | null = null

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
}

const router = useRouter()
const navigationStore = useNavigationStore()

// API配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// 数据状态
const prompts = ref<Prompt[]>([])
const isLoading = ref(false)
const currentPage = ref(1)
const pageSize = 10
const total = ref(0)

// 搜索和筛选
const selectedTag = ref('')
const sortBy = ref('create_time')
const onlyFavorites = ref('0')
const availableTags = ref<string[]>([])

// 监听搜索关键词变化（只有通过父组件更新时才调用）
watch(searchKeyword, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    currentPage.value = 1
    loadPrompts()
  }
}, { immediate: false })

// 暴露搜索方法给父组件
const searchWithKeyword = (keyword: string) => {
  searchKeyword.value = keyword
  currentPage.value = 1
}

// 暴露方法
defineExpose({
  searchWithKeyword
})

// UI状态
const showActionMenu = ref<Record<number, boolean>>({})
const showDetailModal = ref(false)
const selectedPrompt = ref<Prompt | null>(null)
const showVersionHistory = ref(false)
const selectedPromptForVersion = ref<Prompt | null>(null)

// 计算属性
const totalPages = computed(() => Math.ceil(total.value / pageSize))

// 加载提示词列表
const loadPrompts = async () => {
  try {
    isLoading.value = true
    
    const token = localStorage.getItem('yprompt_token')
    if (!token) {
      throw new Error('请先登录')
    }

    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: pageSize.toString(),
      keyword: searchKeyword.value,
      tag: selectedTag.value,
      sort: sortBy.value,
      is_favorite: onlyFavorites.value
    })

    const response = await fetch(`${API_BASE_URL}/api/prompts/?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const result = await response.json()
    if (result.code === 200) {
      prompts.value = result.data.items.map((item: any) => ({
        ...item,
        final_prompt: item.final_prompt || '',
        current_version: item.current_version || '1.0.0'
      }))
      total.value = result.data.total
      
      // 提取所有可用标签
      const allTags = new Set<string>()
      prompts.value.forEach(prompt => {
        if (prompt.tags) {
          prompt.tags.forEach(tag => allTags.add(tag))
        }
      })
      availableTags.value = Array.from(allTags).sort()
    } else {
      throw new Error(result.message || '加载失败')
    }
  } catch (err: any) {
    console.error('加载提示词列表失败:', err)
    alert(`加载失败: ${err.message}`)
  } finally {
    isLoading.value = false
  }
}

// 搜索处理（防抖）- 保留供将来使用
// const handleSearch = () => {
//   // 清除之前的定时器
//   if (searchTimer) {
//     clearTimeout(searchTimer)
//   }
//   
//   // 设置新的定时器，500ms后执行搜索
//   searchTimer = setTimeout(() => {
//     currentPage.value = 1
//     loadPrompts()
//   }, 500)
// }

// 分页
const changePage = (page: number) => {
  currentPage.value = page
  loadPrompts()
}

// 查看详情
const handleViewPrompt = async (prompt: Prompt) => {
  try {
    const token = localStorage.getItem('yprompt_token')
    if (!token) return

    // 获取详情，后端会自动增加view_count
    const response = await fetch(`${API_BASE_URL}/api/prompts/${prompt.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const result = await response.json()
    if (result.code === 200) {
      // 更新prompt数据
      selectedPrompt.value = result.data as Prompt
      showDetailModal.value = true
    }
  } catch (err) {
    console.error('获取提示词详情失败:', err)
    // 即使失败也显示弹窗（使用列表中的数据）
    selectedPrompt.value = prompt as Prompt
    showDetailModal.value = true
  }
}

// 切换收藏状态（保留供将来使用）
// const toggleFavorite = async (prompt: Prompt) => {
//   try {
//     const token = localStorage.getItem('yprompt_token')
//     if (!token) return

//     const response = await fetch(`${API_BASE_URL}/api/prompts/${prompt.id}/favorite`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`
//       },
//       body: JSON.stringify({
//         is_favorite: !prompt.is_favorite ? 1 : 0
//       })
//     })

//     const result = await response.json()
//     if (result.code === 200) {
//       prompt.is_favorite = !prompt.is_favorite
//     }
//   } catch (err: any) {
//     console.error('切换收藏状态失败:', err)
//     alert(`操作失败: ${err.message}`)
//   }
// }

// 编辑提示词
const handleEditPrompt = (prompt: Prompt) => {
  selectedPrompt.value = prompt
  showDetailModal.value = true
  
  // 直接设置延时来触发编辑
  setTimeout(() => {
    const editBtn = document.querySelector('button[data-edit="prompt-detail"]') as HTMLElement
    if (editBtn) {
      editBtn.click()
    }
  }, 100)
}

// 提示词更新完成回调
const handlePromptUpdated = (updatedPrompt: Prompt) => {
  // 更新列表中对应的数据
  const index = prompts.value.findIndex(p => p.id === updatedPrompt.id)
  if (index !== -1) {
    prompts.value[index] = { ...updatedPrompt }
  }
  // 关闭模态框
  showDetailModal.value = false
}

// 优化提示词
const handleOptimizePrompt = (prompt: Prompt) => {
  navigationStore.setCurrentModule('optimize')
  router.push(`/optimize/${prompt.id}`)
  showDetailModal.value = false
}

// 复制提示词
const handleCopyPrompt = async (prompt: Prompt) => {
  try {
    await copyUtil(prompt.final_prompt)
    alert('提示词已复制到剪贴板')
  } catch (err) {
    console.error('复制失败:', err)
    alert('复制失败')
  }
}

// 显示版本历史
const handleShowVersionHistory = (prompt: Prompt) => {
  selectedPromptForVersion.value = prompt
  showVersionHistory.value = true
  showActionMenu.value = {}
}

// 处理版本回滚完成
const handleVersionRollback = () => {
  // 不显示通知，版本组件已经显示过了
  loadPrompts()
}

// 删除提示词
const handleDeletePrompt = async (prompt: Prompt) => {
  if (!confirm(`确定要删除提示词"${prompt.title}"吗？此操作不可恢复。`)) {
    return
  }

  try {
    const token = localStorage.getItem('yprompt_token')
    if (!token) return

    const response = await fetch(`${API_BASE_URL}/api/prompts/${prompt.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const result = await response.json()
    if (result.code === 200) {
      alert('删除成功')
      loadPrompts()
    } else {
      throw new Error(result.message || '删除失败')
    }
  } catch (err: any) {
    console.error('删除提示词失败:', err)
    alert(`删除失败: ${err.message}`)
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 点击外部关闭下拉菜单
document.addEventListener('click', (e) => {
  if (!(e.target as Element).closest('.relative.group')) {
    showActionMenu.value = {}
  }
})

// 组件挂载时加载数据
onMounted(() => {
  loadPrompts()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>