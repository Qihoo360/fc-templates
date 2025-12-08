<template>
  <div class="h-full flex flex-col overflow-hidden p-2 playground-container">
    <SettingsModal />
    <SystemPromptModal
      :is-open="showSystemPromptModal"
      v-model="systemPromptDraft"
      :title="'设置系统提示词'"
      @close="showSystemPromptModal = false"
      @save="handleSystemPromptSave"
    />

    <div class="bg-white rounded-lg shadow-sm p-4 mb-4 flex-shrink-0">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="min-w-0">
          <h1 class="text-xl lg:text-2xl font-bold text-gray-900">提示词操练场</h1>
          <p class="text-sm text-gray-500">实时调试提示词、网页、图表与可视化 Artifact</p>
        </div>
        <div class="flex items-center gap-3 flex-wrap lg:flex-nowrap">
          <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <label class="text-sm font-medium text-gray-700 whitespace-nowrap">AI模型:</label>
            <select
              v-model="settingsStore.selectedProvider"
              @change="onProviderChange"
              class="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 min-w-[160px]"
            >
              <option value="">选择提供商</option>
              <option
                v-for="provider in availableProviders"
                :key="provider.id"
                :value="provider.id"
              >
                {{ provider.name }}
              </option>
            </select>
            <select
              v-model="settingsStore.selectedModel"
              @change="settingsStore.saveSettings"
              :disabled="!settingsStore.selectedProvider"
              class="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50 min-w-[160px]"
            >
              <option value="">选择模型</option>
              <option
                v-for="model in availableModels"
                :key="model.id"
                :value="model.id"
              >
                {{ model.name }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 min-h-0">
      <PlaygroundApp
        :system-prompt="systemPrompt"
        @open-system-prompt="openSystemPromptModal"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PlaygroundApp from '@/components/playground/PlaygroundApp.js'
import SystemPromptModal from '@/components/modules/optimize/components/SystemPromptModal.vue'
import SettingsModal from '@/components/settings/SettingsModal.vue'
import '@/utils/playgroundGlobals'
import '@/style/playground.css'
import { useSettingsStore } from '@/stores/settingsStore'

const settingsStore = useSettingsStore()

const availableProviders = computed(() => settingsStore.getAvailableProviders())
const availableModels = computed(() => {
  if (!settingsStore.selectedProvider) return []
  return settingsStore.getAvailableModels(settingsStore.selectedProvider)
})

const onProviderChange = () => {
  settingsStore.selectedModel = ''
  const models = availableModels.value
  if (models.length > 0) {
    settingsStore.selectedModel = models[0].id
  }
  settingsStore.saveSettings()
}

const STORAGE_KEY = 'yprompt_playground_system_prompt'
const systemPrompt = ref('')
const systemPromptDraft = ref('')
const showSystemPromptModal = ref(false)

if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      systemPrompt.value = saved
    }
  } catch (error) {
    console.warn('加载系统提示词失败', error)
  }
}

watch(systemPrompt, (value) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, value)
})

const openSystemPromptModal = () => {
  systemPromptDraft.value = systemPrompt.value
  showSystemPromptModal.value = true
}

const handleSystemPromptSave = () => {
  systemPrompt.value = systemPromptDraft.value
}
</script>
