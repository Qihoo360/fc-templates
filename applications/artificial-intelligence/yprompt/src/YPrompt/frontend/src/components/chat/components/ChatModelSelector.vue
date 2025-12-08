<template>
  <div v-if="show" class="px-4 pb-2 border-b border-gray-200 bg-gray-50">
    <div class="py-2 space-y-2">
      <div class="flex items-center justify-between">
        <label class="text-sm font-medium text-gray-700">AI助手专用模型</label>
        <button
          v-if="chatProvider"
          @click="$emit('reset')"
          class="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          title="重置为全局模型"
        >
          重置
        </button>
      </div>
      
      <div class="flex flex-col sm:flex-row gap-2">
        <div class="flex-1">
          <select
            :value="chatProvider"
            @change="$emit('update:chatProvider', ($event.target as HTMLSelectElement).value)"
            class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">使用全局模型</option>
            <option
              v-for="provider in availableProviders"
              :key="provider.id"
              :value="provider.id"
            >
              {{ provider.name }}
            </option>
          </select>
        </div>
        
        <div class="flex-1">
          <select
            :value="chatModel"
            @change="$emit('update:chatModel', ($event.target as HTMLSelectElement).value)"
            :disabled="!chatProvider"
            class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100"
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
      
      <div class="text-xs text-gray-500">
        <span v-if="!chatProvider">当前: 跟随全局模型设置</span>
        <span v-else-if="!chatModel">请选择模型</span>
        <span v-else>当前: {{ modelDisplay }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProviderConfig, ModelConfig } from '@/stores/settingsStore'

defineProps<{
  show: boolean
  chatProvider: string
  chatModel: string
  availableProviders: ProviderConfig[]
  availableModels: ModelConfig[]
  modelDisplay: string
}>()

defineEmits<{
  'update:chatProvider': [value: string]
  'update:chatModel': [value: string]
  reset: []
}>()
</script>
