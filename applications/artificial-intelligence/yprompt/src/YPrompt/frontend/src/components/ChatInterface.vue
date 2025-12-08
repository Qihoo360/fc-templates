<template>
  <div 
    class="bg-white rounded-lg shadow-sm flex flex-col h-full max-h-full overflow-hidden relative"
    @dragover.prevent="chatAttachments.handleGlobalDragOver"
    @dragenter.prevent="chatAttachments.handleGlobalDragEnter"
    @dragleave.prevent="chatAttachments.handleGlobalDragLeave"
    @drop.prevent="chatAttachments.handleGlobalDrop"
  >
    <!-- Chat Header -->
    <ChatHeader
      :is-mobile="props.isMobile"
      :is-expanded="props.isExpanded"
      :is-stream-mode="chatModel.isStreamMode.value"
      :model-title="chatModel.chatModel.value ? `当前模型: ${chatModel.getChatModelDisplay()}` : '选择AI助手专用模型'"
      @toggle-model-selector="chatModel.showModelSelector.value = !chatModel.showModelSelector.value"
      @toggle="$emit('toggle')"
      @toggle-stream="chatModel.toggleStreamMode"
      @clear-chat="chatLogic.clearChat"
    />

    <!-- AI助手模型选择器 -->
    <ChatModelSelector
      :show="chatModel.showModelSelector.value"
      v-model:chat-provider="chatModel.chatProvider.value"
      v-model:chat-model="chatModel.chatModel.value"
      :available-providers="chatModel.availableChatProviders.value"
      :available-models="chatModel.availableChatModels.value"
      :model-display="chatModel.getChatModelDisplay()"
      @update:chat-provider="chatModel.onChatProviderChange"
      @update:chat-model="chatModel.saveChatModelSettings"
      @reset="chatModel.resetChatModel"
    />

    <!-- Chat Messages -->
    <ChatMessageList
      :chat-container="chatMessages.chatContainer"
      :chat-container-max-height="chatLogic.chatContainerMaxHeight.value"
      :editing-content="chatMessageOperations.editingContent.value"
      @start-edit="chatMessageOperations.startEdit"
      @save-edit="chatMessageOperations.saveEdit"
      @cancel-edit="chatMessageOperations.cancelEdit"
      @delete="chatMessageOperations.deleteMessage"
      @copy="chatMessageOperations.copyMessage"
      @regenerate="handleRegenerate"
      @resend="handleResend"
      @resend-user="handleResendUser"
      @edit-keydown="chatMessageOperations.handleEditKeydown"
      @set-edit-ref="(payload) => chatMessageOperations.setEditTextareaRef(payload.messageId, payload.el)"
      @set-message-ref="chatMessageOperations.setMessageRef"
    />

    <!-- 快速回复选项 -->
    <ChatQuickReplies
      :show="chatQuickReplies.shouldShowQuickReplies.value"
      :replies="chatQuickReplies.quickReplies.value"
      :quick-replies-container="chatQuickReplies.quickRepliesContainer"
      :input-container-ref="inputContainer"
      @select="handleQuickReplySelect"
    />

    <!-- Input Area -->
    <ChatInputArea
      :is-mobile="props.isMobile"
      :is-editing="chatMessageOperations.isEditing.value"
      v-model:user-input="chatInput.userInput.value"
      :attachments="chatAttachments.currentAttachments.value"
      :placeholder="chatQuickReplies.shouldShowQuickReplies.value ? '输入或点击上方快速回复...' : 'Shift+Enter换行'"
      :is-disabled="promptStore.isTyping || promptStore.isGenerating"
      :textarea-ref="chatInput.textareaRef.value"
      :input-container="inputContainer"
      :show-quick-replies="chatQuickReplies.shouldShowQuickReplies.value"
      :quick-replies="chatQuickReplies.quickReplies.value"
      :quick-replies-container="chatQuickReplies.quickRepliesContainer"
      @keydown="handleInputKeydown"
      @composition-start="chatInput.handleCompositionStart"
      @composition-end="chatInput.handleCompositionEnd"
      @focus="chatQuickReplies.showQuickReplies.value = true"
      @send="handleSendMessage"
      @file-select="chatAttachments.handleFileSelect"
      @remove-attachment="chatAttachments.removeAttachment"
      @clear-attachments="chatAttachments.clearAttachments"
      @quick-reply-select="handleQuickReplySelect"
    />
    
    <!-- 全局拖拽覆盖层 -->
    <div
      v-if="chatAttachments.isGlobalDragging.value"
      class="absolute inset-0 bg-blue-50 bg-opacity-90 flex items-center justify-center z-50 border-2 border-dashed border-blue-400 rounded-lg"
    >
      <div class="text-center">
        <Upload class="w-12 h-12 mx-auto mb-4 text-blue-500" />
        <div class="text-lg font-medium text-blue-700 mb-2">
          释放文件以上传
        </div>
        <div class="text-sm text-blue-600">
          支持图片、文档、音频等格式
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePromptStore } from '@/stores/promptStore'
import { Upload } from 'lucide-vue-next'

// Import components
import ChatHeader from '@/components/chat/components/ChatHeader.vue'
import ChatModelSelector from '@/components/chat/components/ChatModelSelector.vue'
import ChatMessageList from '@/components/chat/components/ChatMessageList.vue'
import ChatQuickReplies from '@/components/chat/components/ChatQuickReplies.vue'
import ChatInputArea from '@/components/chat/components/ChatInputArea.vue'

// Import composables
import { useChatMessages } from '@/components/chat/composables/useChatMessages'
import { useChatInput } from '@/components/chat/composables/useChatInput'
import { useChatAttachments } from '@/components/chat/composables/useChatAttachments'
import { useChatModel } from '@/components/chat/composables/useChatModel'
import { useChatQuickReplies } from '@/components/chat/composables/useChatQuickReplies'
import { useChatMessageOperations } from '@/components/chat/composables/useChatMessageOperations'
import { useChatLogic } from '@/components/chat/composables/useChatLogic'

// Props
const props = defineProps<{
  isMobile?: boolean
  isExpanded?: boolean
}>()

// Emits
defineEmits<{
  toggle: []
}>()

// Stores
const promptStore = usePromptStore()

// Refs for containers
const inputContainer = ref<HTMLElement>()

// Initialize composables
const chatMessages = useChatMessages()
const chatInput = useChatInput()
const chatAttachments = useChatAttachments()
const chatModel = useChatModel()
const chatQuickReplies = useChatQuickReplies(inputContainer)
const chatMessageOperations = useChatMessageOperations(chatMessages.chatContainer)

const chatLogic = useChatLogic(
  chatMessages,
  { 
    ...chatModel,
    showModelSelector: chatModel.showModelSelector 
  },
  chatInput,
  chatAttachments,
  chatQuickReplies
)

// Event handlers that bridge composables and components
const handleInputKeydown = (event: KeyboardEvent) => {
  chatInput.handleKeydown(event, handleSendMessage)
}

const handleSendMessage = () => {
  chatLogic.sendMessage(chatInput.userInput.value)
}

const handleQuickReplySelect = (reply: string) => {
  chatQuickReplies.selectQuickReply(reply, (selectedReply: string) => {
    chatInput.userInput.value = selectedReply
    handleSendMessage()
  })
}

const handleRegenerate = (payload: { messageId: string, messageIndex: number }) => {
  const { provider, model } = chatModel.getCurrentChatModel()
  chatLogic.regenerateMessage(payload.messageId, payload.messageIndex, provider, model)
}

const handleResend = (payload: { messageId: string, messageIndex: number }) => {
  // Handle resend for edited messages - for user messages in edit mode
  const message = promptStore.chatMessages.find(msg => msg.id === payload.messageId)
  if (message && message.type === 'user') {
    // Save the edit first, then resend
    chatMessageOperations.saveEdit(payload.messageId)
    const { provider, model } = chatModel.getCurrentChatModel()
    chatLogic.resendUserMessage(payload.messageId, payload.messageIndex, provider, model)
  }
}

const handleResendUser = (payload: { messageId: string, messageIndex: number }) => {
  const { provider, model } = chatModel.getCurrentChatModel()
  chatLogic.resendUserMessage(payload.messageId, payload.messageIndex, provider, model)
}

// Initialize chat on mount
onMounted(() => {
  chatLogic.initializeChat()
})
</script>