<template>
  <div class="h-full flex flex-col">
    <!-- 头部 -->
    <div class="p-4 border-b border-gray-200">
      <h2 class="text-lg font-semibold text-gray-800 mb-1">优化建议</h2>
      <p class="text-sm text-gray-600">查看并应用AI生成的优化建议</p>
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 overflow-hidden">
      <!-- 建议列表 -->
      <div v-if="suggestions.length > 0" class="h-full overflow-y-auto">
        <!-- 全选操作 -->
        <div class="p-4 border-b border-gray-200 bg-gray-50">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <input
                type="checkbox"
                :checked="allSelected"
                @change="toggleSelectAll"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              >
              <span class="text-sm text-gray-700">
                已选择 {{ selectedSuggestions.length }} / {{ suggestions.length }} 条建议
              </span>
            </div>
            <div class="flex items-center space-x-2">
              <button
                @click="selectAllSuggestions"
                class="text-xs text-blue-600 hover:text-blue-700"
              >
                全选
              </button>
              <button
                @click="deselectAllSuggestions"
                class="text-xs text-gray-600 hover:text-gray-700"
              >
                清空
              </button>
            </div>
          </div>
        </div>

        <!-- 建议卡片列表 -->
        <div class="p-4 space-y-3">
          <div
            v-for="suggestion in suggestions"
            :key="suggestion.id"
            class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <!-- 建议头部 -->
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-start space-x-3 flex-1">
                <input
                  type="checkbox"
                  :checked="selectedSuggestions.includes(suggestion.id)"
                  @change="toggleSuggestion(suggestion.id)"
                  class="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                >
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-1">
                    <h3 class="font-medium text-gray-900">{{ suggestion.title }}</h3>
                    <span
                      :class="getPriorityClass(suggestion.priority)"
                      class="px-2 py-0.5 text-xs rounded-full"
                    >
                      {{ getPriorityLabel(suggestion.priority) }}
                    </span>
                    <span class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {{ getCategoryLabel(suggestion.category) }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 mb-2">{{ suggestion.description }}</p>
                  <div class="space-y-1">
                    <p class="text-xs text-gray-500">
                      <strong>原因:</strong> {{ suggestion.reason }}
                    </p>
                    <p class="text-xs text-gray-500">
                      <strong>预期效果:</strong> {{ suggestion.expectedEffect }}
                    </p>
                  </div>
                </div>
              </div>
              <button
                @click="editSuggestion(suggestion)"
                class="text-gray-400 hover:text-gray-600 p-1"
                title="编辑建议"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>

            <!-- 建议内容 -->
            <div v-if="suggestion.content" class="mt-3 p-3 bg-gray-50 rounded border">
              <div class="text-xs font-medium text-gray-700 mb-1">建议内容:</div>
              <div class="text-sm text-gray-800 whitespace-pre-wrap">{{ suggestion.content }}</div>
            </div>

            <!-- 操作按钮 -->
            <div class="mt-3 flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <button
                  @click="previewSuggestion(suggestion)"
                  class="text-xs text-blue-600 hover:text-blue-700"
                >
                  预览效果
                </button>
                <button
                  @click="applySingleSuggestion(suggestion)"
                  :disabled="isApplyingSuggestions"
                  class="text-xs text-green-600 hover:text-green-700 disabled:opacity-50"
                >
                  仅应用此条
                </button>
              </div>
              <button
                @click="removeSuggestion(suggestion.id)"
                class="text-xs text-red-600 hover:text-red-700"
              >
                删除
              </button>
            </div>
          </div>
        </div>

        <!-- 应用选中建议 -->
        <div class="p-4 border-t border-gray-200 bg-gray-50">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-700">
              {{ selectedSuggestions.length > 0 
                ? `将应用 ${selectedSuggestions.length} 条建议` 
                : '请选择要应用的建议' }}
            </span>
            <button
              @click="applySelectedSuggestions"
              :disabled="selectedSuggestions.length === 0 || isApplyingSuggestions"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <span v-if="isApplyingSuggestions" class="flex items-center gap-1">
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                应用中...
              </span>
              <span v-else>应用选中建议</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="h-full flex items-center justify-center">
        <div class="text-center">
          <div class="text-4xl mb-3">💡</div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">暂无优化建议</h3>
          <p class="text-sm text-gray-600 mb-4">
            请先在输入区添加提示词内容，然后点击"生成优化建议"
          </p>
          <button
            @click="$emit('switch-to-input')"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            去输入提示词
          </button>
        </div>
      </div>
    </div>

    <!-- 优化结果 -->
    <div v-if="hasOptimizedPrompt" class="border-t border-gray-200">
      <div class="p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold text-gray-800">优化结果</h3>
          <div class="flex items-center space-x-2">
            <VersionSelector />
            <button
              @click="showDiffView = true"
              class="text-xs text-blue-600 hover:text-blue-700"
            >
              查看对比
            </button>
          </div>
        </div>

        <!-- 标签页 -->
        <div class="flex space-x-1 mb-3 border-b">
          <button
            v-for="tab in resultTabs"
            :key="tab.key"
            @click="activeResultTab = tab.key as 'system' | 'user'"
            :class="[
              'px-3 py-2 text-sm font-medium transition-colors border-b-2',
              activeResultTab === tab.key
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            ]"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- 内容显示 -->
        <div class="space-y-3">
          <div v-if="activeResultTab === 'system'" class="p-3 bg-gray-50 rounded border">
            <div class="text-xs font-medium text-gray-700 mb-2">系统提示词:</div>
            <div class="text-sm text-gray-800 whitespace-pre-wrap max-h-40 overflow-y-auto">
              {{ optimizedPrompts.system || '未修改' }}
            </div>
          </div>

          <div v-if="activeResultTab === 'user'" class="p-3 bg-gray-50 rounded border">
            <div class="text-xs font-medium text-gray-700 mb-2">用户提示词:</div>
            <div class="text-sm text-gray-800 whitespace-pre-wrap max-h-40 overflow-y-auto">
              {{ optimizedPrompts.user || '未修改' }}
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="mt-4 flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <button
              @click="copyOptimizedPrompt"
              class="text-xs text-gray-600 hover:text-gray-700"
            >
              复制结果
            </button>
            <button
              @click="saveToLibrary"
              class="text-xs text-blue-600 hover:text-blue-700"
            >
              保存到提示词库
            </button>
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="$emit('switch-to-test')"
              class="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs"
            >
              测试效果
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Diff 查看器模态框 -->
    <div v-if="showDiffView" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] w-[90vw] overflow-hidden">
        <DiffViewer
          :left-content="systemPrompt"
          :right-content="optimizedPrompts.system"
          left-label="原始版本"
          right-label="优化版本"
          @close="showDiffView = false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed } from 'vue'
import { useOptimizeStore } from '@/stores/optimizeStore'
import { useOptimizeModule } from '../composables/useOptimizeModule'
import { copyToClipboard as copyUtil } from '@/utils/clipboardUtils'
import VersionSelector from './VersionSelector.vue'
import DiffViewer from './DiffViewer.vue'
import type { Suggestion } from '@/stores/optimizeStore'

const emit = defineEmits<{
  'switch-to-input': []
  'switch-to-test': []
}>()

const optimizeStore = useOptimizeStore()
const { applySuggestions, toggleSuggestion, selectAllSuggestions, deselectAllSuggestions } = useOptimizeModule()

const {
  systemPrompt,
  optimizedPrompts,
  suggestions,
  selectedSuggestions,
  isApplyingSuggestions,
  hasOptimizedPrompt
} = optimizeStore

// 本地状态
const activeResultTab = ref<'system' | 'user'>('system')
const showDiffView = ref(false)

const resultTabs = [
  { key: 'system', label: '系统提示词' },
  { key: 'user', label: '用户提示词' }
]

// 计算属性
const allSelected = computed(() => 
  suggestions.length > 0 && selectedSuggestions.length === suggestions.length
)

// 事件处理
const toggleSelectAll = () => {
  if (allSelected.value) {
    deselectAllSuggestions()
  } else {
    selectAllSuggestions()
  }
}

const editSuggestion = (suggestion: Suggestion) => {
  // 实现编辑建议的逻辑
  console.log('Edit suggestion:', suggestion)
}

const previewSuggestion = (suggestion: Suggestion) => {
  // 实现预览建议的逻辑
  console.log('Preview suggestion:', suggestion)
}

const applySingleSuggestion = async (suggestion: Suggestion) => {
  const originalSelected = [...selectedSuggestions]
  optimizeStore.selectedSuggestions = [suggestion.id]
  await applySuggestions()
  optimizeStore.selectedSuggestions = originalSelected
}

const applySelectedSuggestions = async () => {
  await applySuggestions()
}

const removeSuggestion = (suggestionId: string) => {
  const index = suggestions.findIndex(s => s.id === suggestionId)
  if (index > -1) {
    optimizeStore.suggestions.splice(index, 1)
    // 同时从选中列表中移除
    const selectedIndex = selectedSuggestions.indexOf(suggestionId)
    if (selectedIndex > -1) {
      optimizeStore.selectedSuggestions.splice(selectedIndex, 1)
    }
  }
}

const copyOptimizedPrompt = () => {
  const content = activeResultTab.value === 'system' 
    ? optimizedPrompts.system 
    : optimizedPrompts.user
  
  copyUtil(content).then(() => {
    // 显示复制成功提示
    console.log('Copied to clipboard')
  })
}

const saveToLibrary = () => {
  // 实现保存到提示词库的逻辑
  console.log('Save to library')
}

// 工具函数
const getPriorityClass = (priority: string) => {
  const classes: Record<string, string> = {
    high: 'bg-red-100 text-red-600',
    medium: 'bg-yellow-100 text-yellow-600',
    low: 'bg-green-100 text-green-600'
  }
  return classes[priority] || 'bg-gray-100 text-gray-600'
}

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级'
  }
  return labels[priority] || priority
}

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    role: '角色',
    profile: '角色描述',
    skills: '技能',
    goal: '目标',
    rules: '规则',
    workflow: '流程',
    format: '格式',
    example: '示例',
    initialization: '初始化',
    task: '任务',
    context: '上下文',
    constraints: '约束',
    language: '语言'
  }
  return labels[category] || category
}
</script>