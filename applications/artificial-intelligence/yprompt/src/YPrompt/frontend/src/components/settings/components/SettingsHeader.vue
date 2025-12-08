<template>
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center space-x-4">
      <h2 class="text-xl font-semibold">设置</h2>
      <div class="flex space-x-1">
        <button
          @click="$emit('update:activeTab', 'providers')"
          :class="[
            'px-3 py-1 rounded text-sm font-medium transition-colors',
            props.activeTab === 'providers' 
              ? 'bg-blue-100 text-blue-700' 
              : 'text-gray-600 hover:text-gray-800'
          ]"
        >
          AI模型
        </button>
        <button
          @click="$emit('update:activeTab', 'prompts')"
          :class="[
            'px-3 py-1 rounded text-sm font-medium transition-colors',
            props.activeTab === 'prompts' 
              ? 'bg-blue-100 text-blue-700' 
              : 'text-gray-600 hover:text-gray-800'
          ]"
        >
          提示词规则
        </button>
      </div>
    </div>
    <button
      @click="$emit('close')"
      class="p-1 hover:bg-gray-100 rounded"
    >
      <X class="w-5 h-5" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'

const props = defineProps<{
  activeTab: 'providers' | 'prompts'
}>()

defineEmits<{
  'update:activeTab': [value: 'providers' | 'prompts']
  close: []
}>()
</script>
