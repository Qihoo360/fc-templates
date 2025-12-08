<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
    <div class="bg-white rounded-lg max-w-md w-full p-6">
      <h3 class="text-lg font-semibold mb-4">
        {{ editing ? '编辑提供商' : `添加${providerType === 'custom' ? '自定义' : ''}提供商` }}
      </h3>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">提供商名称</label>
          <input
            :value="name"
            @input="$emit('update:name', ($event.target as HTMLInputElement).value)"
            type="text"
            :placeholder="providerType === 'custom' ? '例如：DeepSeek' : '可自定义名称'"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div v-if="providerType === 'custom' || (providerType && ['openai', 'anthropic', 'google'].includes(providerType) && getProviderTemplate(providerType).allowCustomUrl)">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            API URL
            <span v-if="providerType !== 'custom'" class="text-xs text-gray-500">(可选，留空使用官方完整地址)</span>
          </label>
          <input
            :value="baseUrl"
            @input="$emit('update:baseUrl', ($event.target as HTMLInputElement).value)"
            type="url"
            :placeholder="getDefaultBaseUrl(providerType)"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">API密钥</label>
          <input
            :value="apiKey"
            @input="$emit('update:apiKey', ($event.target as HTMLInputElement).value)"
            type="password"
            placeholder="输入API密钥"
            autocomplete="off"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div class="flex justify-end space-x-3 mt-6">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          取消
        </button>
        <button
          @click="$emit('save')"
          :disabled="!name || (providerType === 'custom' && !baseUrl)"
          class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {{ editing ? '保存' : '添加' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  editing: boolean
  providerType: 'openai' | 'anthropic' | 'google' | 'custom'
  name: string
  baseUrl: string
  apiKey: string
  getDefaultBaseUrl: (type: string) => string
  getProviderTemplate: (type: 'openai' | 'anthropic' | 'google' | 'custom') => any
}>()

defineEmits<{
  'update:name': [value: string]
  'update:baseUrl': [value: string]
  'update:apiKey': [value: string]
  save: []
  close: []
}>()
</script>
