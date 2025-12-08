<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
    <div class="bg-white rounded-lg max-w-md w-full p-6">
      <h3 class="text-lg font-semibold mb-4">选择提供商类型</h3>
      
      <div class="space-y-3">
        <button
          @click="$emit('select', 'openai')"
          class="w-full p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-colors"
        >
          <div class="flex items-center space-x-3">
            <div class="w-3 h-3 rounded-full bg-green-500"></div>
            <div>
              <h4 class="font-medium">OpenAI</h4>
              <p class="text-sm text-gray-500">官方OpenAI API或兼容服务</p>
            </div>
          </div>
        </button>

        <button
          @click="$emit('select', 'anthropic')"
          class="w-full p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-colors"
        >
          <div class="flex items-center space-x-3">
            <div class="w-3 h-3 rounded-full bg-purple-500"></div>
            <div>
              <h4 class="font-medium">Anthropic</h4>
              <p class="text-sm text-gray-500">官方Claude API或兼容服务</p>
            </div>
          </div>
        </button>

        <button
          @click="$emit('select', 'google')"
          class="w-full p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-colors"
        >
          <div class="flex items-center space-x-3">
            <div class="w-3 h-3 rounded-full bg-blue-500"></div>
            <div>
              <h4 class="font-medium">Gemini</h4>
              <p class="text-sm text-gray-500">官方Gemini API或兼容服务</p>
            </div>
          </div>
        </button>

        <button
          @click="$emit('select', 'custom')"
          class="w-full p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-colors"
        >
          <div class="flex items-center space-x-3">
            <div class="w-3 h-3 rounded-full bg-gray-500"></div>
            <div>
              <h4 class="font-medium">自定义服务</h4>
              <p class="text-sm text-gray-500">第三方API服务或中转代理</p>
            </div>
          </div>
        </button>
      </div>

      <div class="flex justify-end space-x-3 mt-6">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          取消
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  select: [type: 'openai' | 'anthropic' | 'google' | 'custom']
  close: []
}>()
</script>
