<template>
  <div
    :class="[
      'flex mb-4 group',
      message.role === 'user' ? 'justify-end' : 'justify-start'
    ]"
  >
    <!-- 头像 -->
    <div 
      :class="[
        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0',
        message.role === 'user' 
          ? 'bg-blue-500 text-white ml-2 order-2' 
          : message.role === 'assistant'
            ? 'bg-green-500 text-white mr-2 order-1'
            : 'bg-purple-500 text-white mr-2 order-1'
      ]"
    >
      {{ getRoleIcon() }}
    </div>

    <!-- 消息内容 -->
    <div 
      :class="[
        'max-w-xs lg:max-w-md px-4 py-3 rounded-lg relative',
        message.role === 'user' 
          ? 'bg-blue-500 text-white order-1' 
          : message.role === 'assistant'
            ? 'bg-green-100 text-gray-800 border border-green-200 order-2'
            : 'bg-purple-100 text-gray-800 border border-purple-200 order-2'
      ]"
    >
      <!-- 编辑模式 -->
      <div v-if="editingIndex === index" class="space-y-2">
        <textarea
          v-model="editingContent"
          class="w-full p-2 border border-gray-300 rounded text-sm resize-none bg-white text-gray-800"
          rows="3"
          placeholder="编辑消息内容..."
        ></textarea>
        <div class="flex justify-end space-x-2">
          <button
            @click="cancelEdit"
            class="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 bg-gray-100 rounded"
          >
            取消
          </button>
          <button
            @click="saveEdit(index)"
            class="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      </div>
      
      <!-- 显示模式 -->
      <div v-else>
        <div class="text-sm whitespace-pre-wrap leading-relaxed">
          {{ message.content }}
        </div>
        
        <!-- 编辑按钮 -->
        <div 
          v-if="message.role !== 'system'"
          class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <button
            @click="editMessage(index)"
            class="p-1 text-xs hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            :class="message.role === 'user' ? 'text-blue-100' : 'text-gray-600'"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 删除按钮 -->
    <div 
      v-if="message.role !== 'system' && editingIndex !== index"
      class="flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
      :class="message.role === 'user' ? 'order-3 ml-2' : 'order-0 mr-2'"
    >
      <button
        @click="removeMessage(index)"
        class="p-1 text-xs text-red-500 hover:bg-red-50 rounded transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface Props {
  message: Message
  index: number
  editingIndex: number | null
  editingContent: string
}

interface Emits {
  'edit-message': [index: number]
  'save-edit': [index: number]
  'cancel-edit': []
  'remove-message': [index: number]
  'update:editing-content': [content: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 计算属性
const editingContent = computed({
  get: () => props.editingContent,
  set: (value) => emit('update:editing-content', value)
})

// 事件处理
const editMessage = (index: number) => {
  emit('edit-message', index)
}

const saveEdit = (index: number) => {
  emit('save-edit', index)
}

const cancelEdit = () => {
  emit('cancel-edit')
}

const removeMessage = (index: number) => {
  emit('remove-message', index)
}

// 工具函数
const getRoleIcon = () => {
  const icons = {
    user: 'U',
    assistant: 'A',
    system: 'S'
  }
  return icons[props.message.role] || '?'
}
</script>