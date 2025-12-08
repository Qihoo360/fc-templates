<template>
  <div 
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click.self="handleClose"
  >
    <div class="bg-white rounded-lg max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
      <div class="flex items-center justify-between p-6 border-b">
        <div>
          <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            版本历史
          </h2>
          <p class="text-sm text-gray-600 mt-1">共 {{ versions.length }} 个版本</p>
        </div>
        <button
          @click="handleClose"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="关闭"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6">
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

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="version in versions"
            :key="version.id"
            @click="handleViewDetail(version)"
            class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-2">
                  <h3 class="text-base font-semibold text-gray-900">
                    v{{ version.version_number }}
                  </h3>
                  <span class="text-xs text-gray-500">
                    {{ formatDate(version.create_time) }}
                  </span>
                </div>
                <p class="text-sm text-gray-700 line-clamp-2">{{ version.change_summary || '无变更说明' }}</p>
              </div>
            </div>

            <div class="flex items-center justify-between text-xs text-gray-500 mb-3">
              <div class="flex items-center gap-4">
                <span class="flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {{ version.author_name }}
                </span>
                <span class="flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  {{ formatSize(version.content_size) }}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2 pt-3 border-t border-gray-100">
              <button
                @click.stop="handleRollback(version)"
                class="flex-1 px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors flex items-center justify-center gap-1"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                回滚到此版本
              </button>
              <button
                @click.stop="handleDelete(version)"
                class="px-3 py-1.5 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors flex items-center justify-center"
                title="删除版本"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
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
import { ref, watch } from 'vue'
import { useNotificationStore } from '@/stores/notificationStore'
import { VersionService, type VersionInfo } from '@/services/versionService'
import VersionDetailModal from './VersionDetailModal.vue'

interface Props {
  isOpen: boolean
  promptId: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
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
      handleClose()
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

const handleClose = () => {
  emit('close')
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
      year: 'numeric',
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

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    loadVersions()
  }
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
