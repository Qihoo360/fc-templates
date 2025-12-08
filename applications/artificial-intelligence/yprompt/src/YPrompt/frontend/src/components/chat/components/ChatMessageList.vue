<template>
  <div 
    :ref="setChatContainerRef" 
    class="flex-1 overflow-y-auto p-4 space-y-4 min-h-0" 
    :style="{ maxHeight: chatContainerMaxHeight }"
  >
    <ChatMessage
      v-for="(message, index) in visibleMessages"
      :key="message.id || index"
      :message="message"
      :message-index="index"
      :editing-content="editingContent[message.id!] || ''"
      :is-disabled="isTyping || isGenerating"
      @start-edit="$emit('start-edit', $event)"
      @save-edit="$emit('save-edit', $event)"
      @cancel-edit="$emit('cancel-edit', $event)"
      @delete="$emit('delete', $event)"
      @copy="$emit('copy', $event)"
      @regenerate="$emit('regenerate', { messageId: $event, messageIndex: index })"
      @resend="$emit('resend', { messageId: $event, messageIndex: index })"
      @resend-user="$emit('resend-user', { messageId: $event, messageIndex: index })"
      @edit-keydown="$emit('edit-keydown', $event)"
      @set-edit-ref="$emit('set-edit-ref', $event)"
      @set-message-ref="$emit('set-message-ref', $event)"
    />
    
    <div v-if="isTyping" class="flex justify-start">
      <div class="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
        <div class="flex space-x-1">
          <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
          <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type Ref, type ComponentPublicInstance } from 'vue'
import { usePromptStore } from '@/stores/promptStore'
import ChatMessage from './ChatMessage.vue'

const props = defineProps<{
  chatContainer?: Ref<HTMLElement | undefined>
  chatContainerMaxHeight: string
  editingContent: Record<string, string>
}>()

defineEmits<{
  'start-edit': [messageId: string]
  'save-edit': [messageId: string]
  'cancel-edit': [messageId: string]
  'delete': [messageId: string]
  'copy': [content: string]
  'regenerate': [payload: { messageId: string, messageIndex: number }]
  'resend': [payload: { messageId: string, messageIndex: number }]
  'resend-user': [payload: { messageId: string, messageIndex: number }]
  'edit-keydown': [payload: { event: KeyboardEvent, messageId: string }]
  'set-edit-ref': [payload: { messageId: string, el: HTMLTextAreaElement | null }]
  'set-message-ref': [payload: { messageId: string, el: HTMLElement | null }]
}>()

const promptStore = usePromptStore()

const visibleMessages = computed(() => {
  return promptStore.chatMessages.filter(msg => !msg.isDeleted)
})

const isTyping = computed(() => promptStore.isTyping)
const isGenerating = computed(() => promptStore.isGenerating)

const setChatContainerRef = (el: Element | ComponentPublicInstance | null) => {
  if (props.chatContainer && el) {
    props.chatContainer.value = el as HTMLElement
  }
}
</script>
