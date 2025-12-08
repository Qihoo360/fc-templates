<template>
  <div
    :ref="(el) => $emit('set-message-ref', { messageId: message.id!, el: el as HTMLElement })"
    :class="message.type === 'user' ? 'justify-end' : 'justify-start'"
    class="flex group"
  >
    <div class="flex flex-col w-full" :class="message.isEditing ? 'max-w-full sm:max-w-2xl' : 'max-w-xs lg:max-w-md'">
      <div
        :class="[
          message.isEditing 
            ? 'bg-transparent border-0 shadow-none p-0' 
            : message.type === 'user' 
              ? 'bg-blue-500 text-white px-4 py-3 rounded-lg' 
              : message.isProgress 
                ? 'bg-blue-50 text-blue-800 border border-blue-200 px-4 py-3 rounded-lg' 
                : 'bg-gray-100 text-gray-800 px-4 py-3 rounded-lg',
          message.isProgress && 'animate-pulse',
          !message.isEditing && (message.type === 'user' ? 'ml-auto' : 'mr-auto'),
          'transition-all duration-300 relative'
        ]"
      >
        <div v-if="message.isEditing" class="relative">
          <div class="relative border border-blue-300 rounded-2xl overflow-hidden bg-white">
            <div class="relative">
              <textarea
                :ref="(el: any) => $emit('set-edit-ref', { messageId: message.id!, el: el as HTMLTextAreaElement })"
                :value="editingContent"
                @input="$emit('update:editingContent', ($event.target as HTMLTextAreaElement).value)"
                class="w-full p-4 border-0 resize-none focus:outline-none text-gray-800 bg-white min-h-[80px] max-h-[200px] overflow-y-auto text-base"
                @keydown="$emit('edit-keydown', { event: $event, messageId: message.id! })"
                placeholder="编辑消息内容..."
              ></textarea>
            </div>
          </div>
        </div>
        
        <div v-else>
          <div
            v-if="message.type === 'ai'"
            v-html="renderMarkdown(message.content)"
            class="prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-800 prose-li:text-gray-800 prose-strong:text-gray-800"
          ></div>
          <div 
            v-else 
            v-html="renderUserMessage(message.content)"
            class="text-white [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-white [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-white [&_h3]:mb-1 [&_h4]:text-sm [&_h4]:font-bold [&_h4]:text-white [&_h5]:text-sm [&_h5]:font-bold [&_h5]:text-white [&_h6]:text-sm [&_h6]:font-bold [&_h6]:text-white [&_p]:text-white [&_p]:mb-2 [&_strong]:font-bold [&_strong]:text-white [&_b]:font-bold [&_b]:text-white [&_em]:italic [&_em]:text-white [&_i]:italic [&_i]:text-white [&_ul]:list-disc [&_ul]:list-inside [&_ul]:text-white [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:text-white [&_ol]:mb-2 [&_li]:text-white [&_li]:mb-1 [&_code]:bg-blue-600 [&_code]:text-blue-100 [&_code]:px-1 [&_code]:rounded [&_code]:font-mono [&_pre]:bg-blue-600 [&_pre]:text-blue-100 [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto [&_a]:text-blue-200 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-blue-300 [&_blockquote]:pl-2 [&_blockquote]:text-blue-100"
          ></div>
        </div>
      </div>
      
      <div 
        v-if="message.attachments && message.attachments.length > 0 && !message.isEditing"
        class="mt-2"
        :class="message.type === 'user' ? 'ml-auto max-w-xs lg:max-w-md' : 'mr-auto max-w-xs lg:max-w-md'"
      >
        <div class="text-xs text-gray-500 mb-1">附件 ({{ message.attachments.length }})</div>
        <div class="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pb-1">
          <div
            v-for="attachment in message.attachments"
            :key="attachment.id"
            class="flex-shrink-0 flex items-center gap-2 px-2 py-1.5 rounded-md text-xs border min-w-0"
            :class="message.type === 'user' ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-100'"
          >
            <div class="flex items-center gap-2 min-w-0">
              <div class="flex-shrink-0">
                <svg v-if="attachment.type === 'image'" class="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <svg v-else-if="attachment.type === 'document'" class="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <svg v-else-if="attachment.type === 'audio'" class="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <svg v-else-if="attachment.type === 'video'" class="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <svg v-else class="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </div>
              <div class="min-w-0 flex-1">
                <div 
                  class="truncate max-w-20 font-medium text-xs"
                  :class="message.type === 'user' ? 'text-blue-700' : 'text-gray-700'"
                  :title="attachment.name"
                >
                  {{ attachment.name }}
                </div>
                <div 
                  class="text-xs"
                  :class="message.type === 'user' ? 'text-blue-500' : 'text-gray-500'"
                >
                  {{ (attachment.size / 1024).toFixed(1) }}KB
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div 
        v-if="!message.isProgress"
        class="flex space-x-1 mt-2 transition-opacity duration-200"
        :class="[
          message.isEditing ? 'opacity-100 justify-end' : 'opacity-0 group-hover:opacity-100 ' + (message.type === 'user' ? 'justify-end' : 'justify-start')
        ]"
      >
        <template v-if="message.isEditing">
          <button
            @click="message.type === 'user' ? $emit('resend', message.id!) : $emit('save-edit', message.id!)"
            class="p-1.5 text-gray-500 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100"
            :title="message.type === 'user' ? '保存并重新发送' : '保存编辑'"
            :disabled="isDisabled"
          >
            <Send class="w-3.5 h-3.5" />
          </button>
          
          <button
            @click="$emit('cancel-edit', message.id!)"
            class="p-1.5 text-gray-500 hover:text-red-600 transition-colors rounded-lg hover:bg-gray-100"
            title="取消编辑"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </template>
        
        <template v-else>
          <button
            v-if="message.type === 'ai'"
            @click="$emit('regenerate', message.id!)"
            class="p-1.5 text-gray-500 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100"
            title="重新生成回复"
            :disabled="isDisabled"
          >
            <RefreshCw class="w-3.5 h-3.5" />
          </button>
          
          <button
            v-if="message.type === 'user'"
            @click="$emit('resend-user', message.id!)"
            class="p-1.5 text-gray-500 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100"
            title="重新发送消息"
            :disabled="isDisabled"
          >
            <Send class="w-3.5 h-3.5" />
          </button>
          
          <button
            @click="$emit('start-edit', message.id!)"
            class="p-1.5 text-gray-500 hover:text-green-600 transition-colors rounded-lg hover:bg-gray-100"
            title="编辑消息"
          >
            <Edit2 class="w-3.5 h-3.5" />
          </button>
          
          <button
            @click="$emit('delete', message.id!)"
            class="p-1.5 text-gray-500 hover:text-red-600 transition-colors rounded-lg hover:bg-gray-100"
            title="删除消息"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
          
          <button
            @click="$emit('copy', message.content)"
            class="p-1.5 text-gray-500 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100"
            title="复制消息内容"
          >
            <Copy class="w-3.5 h-3.5" />
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RefreshCw, Edit2, Trash2, Copy, X, Send } from 'lucide-vue-next'
import { marked } from 'marked'
import type { ChatMessage } from '@/stores/promptStore'

defineProps<{
  message: ChatMessage
  messageIndex: number
  editingContent: string
  isDisabled: boolean
}>()

defineEmits<{
  'start-edit': [messageId: string]
  'save-edit': [messageId: string]
  'cancel-edit': [messageId: string]
  'delete': [messageId: string]
  'copy': [content: string]
  'regenerate': [messageId: string]
  'resend': [messageId: string]
  'resend-user': [messageId: string]
  'edit-keydown': [payload: { event: KeyboardEvent, messageId: string }]
  'set-edit-ref': [payload: { messageId: string, el: HTMLTextAreaElement | null }]
  'set-message-ref': [payload: { messageId: string, el: HTMLElement | null }]
  'update:editingContent': [value: string]
}>()

const renderMarkdown = (content: string): string => {
  try {
    const result = marked(content, {
      breaks: true,
      gfm: true
    })
    return typeof result === 'string' ? result : String(result)
  } catch (error) {
    return content
  }
}

const renderUserMessage = (content: string): string => {
  try {
    const hasMarkdown = /^#|^\*\*|^##|^\*|^-|\*\*.*\*\*|^1\.|```/.test(content) || 
                       content.includes('**') || content.includes('##') || content.includes('# ')
    
    if (hasMarkdown || content.length > 50) {
      const result = marked(content, {
        breaks: true,
        gfm: true
      })
      return typeof result === 'string' ? result : String(result)
    } else {
      return content.replace(/\n/g, '<br>')
    }
  } catch (error) {
    try {
      const result = marked(content, { breaks: true, gfm: true })
      return typeof result === 'string' ? result : String(result)
    } catch {
      return content.replace(/\n/g, '<br>')
    }
  }
}
</script>
