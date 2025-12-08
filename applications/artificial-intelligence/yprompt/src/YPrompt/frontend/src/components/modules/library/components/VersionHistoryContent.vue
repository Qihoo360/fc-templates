<template>
  <div class="h-full flex flex-col">
    <div v-if="isLoading" class="flex items-center justify-center h-32">
      <div class="flex items-center gap-2 text-gray-500">
        <div class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span>加载中...</span>
      </div>
    </div>

    <div v-else-if="versions.length === 0" class="flex flex-col items-center justify-center h-32 text-center">
      <svg class="w-12 h-12 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="text-gray-600">暂无版本历史</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-2">
      <div
        v-for="version in versions"
        :key="version.id"
        @click="handleViewDetail(version)"
        class="border border-gray-200 rounded-md p-2.5 hover:shadow-md transition-shadow cursor-pointer"
      >
        <div class="flex items-start justify-between mb-1.5">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-0.5">
              <h4 class="text-sm font-semibold text-gray-900">
                v{{ version.version_number }}
              </h4>
              <span class="text-xs text-gray-500">
                {{ formatDate(version.create_time) }}
              </span>
            </div>
            <p class="text-xs text-gray-600 line-clamp-1">{{ version.change_summary || '优化提示词' }}</p>
          </div>
        </div>

        <div class="flex items-center text-xs text-gray-500 mb-1.5">
          <span class="flex items-center gap-0.5">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span class="truncate max-w-[80px]">{{ version.author_name }}</span>
          </span>
          <span class="mx-2 text-gray-300">•</span>
          <span class="flex items-center gap-0.5">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            {{ formatSize(version.content_size) }}
          </span>
        </div>

        <div class="flex items-center gap-1.5 pt-1.5 border-t border-gray-100">
          <button
            @click.stop="handleRollback(version)"
            class="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 rounded transition-colors flex items-center gap-1"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>回滚</span>
          </button>
          <button
            @click.stop="handleDelete(version)"
            class="px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors flex items-center justify-center"
            title="删除版本"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <VersionDetailModal
      v-if="showDetailModal"
      :version="selectedVersion"
      :prompt-id="promptId"
      @close="showDetailModal = false"
      @rollback="handleRollback"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNotificationStore } from '@/stores/notificationStore'
import { VersionService, type VersionInfo } from '@/services/versionService'
import VersionDetailModal from './VersionDetailModal.vue'

interface Props {
  promptId: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  rollback: [versionNumber: string]
}>()

const notificationStore = useNotificationStore()

const versions = ref<VersionInfo[]>([])
const isLoading = ref(false)

const showDetailModal = ref(false)
const selectedVersion = ref<VersionInfo | null>(null)

const loadVersions = async () => {
  try {
    isLoading.value = true
    const result = await VersionService.getVersionList(props.promptId, 1, 10)
    
    if (result.code === 200) {
      versions.value = result.data.items
    } else {
      throw new Error(result.message || '加载失败')
    }
  } catch (err: any) {
    console.error('加载版本历史失败:', err)
    notificationStore.error(`加载失败: ${err.message}`)
  } finally {
    isLoading.value = false
  }
}

const handleViewDetail = (version: VersionInfo) => {
  selectedVersion.value = version
  showDetailModal.value = true
}

const handleRollback = async (version: VersionInfo) => {
  if (!confirm(`确定要回滚到版本 v${version.version_number} 吗？`)) {
    return
  }

  try {
    const result = await VersionService.rollbackToVersion(props.promptId, version.id, {
      change_summary: `回滚到版本 ${version.version_number}`
    })

    if (result.code === 200) {
      notificationStore.success(`成功回滚到版本 v${version.version_number}`)
      emit('rollback', version.version_number)
      loadVersions()
      showDetailModal.value = false
    } else {
      throw new Error(result.message || '回滚失败')
    }
  } catch (err: any) {
    console.error('回滚失败:', err)
    notificationStore.error(`回滚失败: ${err.message}`)
  }
}

const handleDelete = async (version: VersionInfo) => {
  if (!confirm(`确定要删除版本 v${version.version_number} 吗？此操作不可恢复。`)) {
    return
  }

  try {
    const result = await VersionService.deleteVersion(props.promptId, version.id)

    if (result.code === 200) {
      notificationStore.success(`版本 v${version.version_number} 已删除`)
      loadVersions()
    } else {
      throw new Error(result.message || '删除失败')
    }
  } catch (err: any) {
    console.error('删除版本失败:', err)
    notificationStore.error(`删除失败: ${err.message}`)
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (days === 1) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

onMounted(() => {
  loadVersions()
})
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
