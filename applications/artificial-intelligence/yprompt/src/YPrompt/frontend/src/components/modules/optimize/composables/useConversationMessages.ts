import { reactive } from 'vue'

export interface ConversationMessage {
  id: string
  role: 'ai' | 'user'
  content: string
  isEditing?: boolean
}

interface ConversationState {
  messages: ConversationMessage[]
}

export function useConversationMessages() {
  const state = reactive<ConversationState>({
    messages: []
  })
  
  const addMessage = (role: 'ai' | 'user' = 'user') => {
    const newMessage: ConversationMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      role,
      content: '',
      isEditing: false
    }
    state.messages.push(newMessage)
  }
  
  const removeMessage = (id: string) => {
    const index = state.messages.findIndex(msg => msg.id === id)
    if (index !== -1) {
      state.messages.splice(index, 1)
    }
  }
  
  const updateMessage = (id: string, content: string) => {
    const message = state.messages.find(msg => msg.id === id)
    if (message) {
      message.content = content
    }
  }
  
  const updateMessageRole = (id: string, role: 'ai' | 'user') => {
    const message = state.messages.find(msg => msg.id === id)
    if (message) {
      message.role = role
    }
  }
  
  const startEdit = (id: string) => {
    state.messages.forEach(msg => {
      msg.isEditing = msg.id === id
    })
  }
  
  const cancelEdit = (id: string) => {
    const message = state.messages.find(msg => msg.id === id)
    if (message) {
      message.isEditing = false
    }
  }
  
  const formatForAI = (): string => {
    if (state.messages.length === 0) return ''
    
    return state.messages
      .filter(msg => msg.content.trim())
      .map(msg => {
        const label = msg.role === 'ai' ? 'AI助手' : '用户'
        return `${label}: ${msg.content}`
      })
      .join('\n\n')
  }
  
  const reset = () => {
    state.messages = []
  }
  
  return {
    state,
    addMessage,
    removeMessage,
    updateMessage,
    updateMessageRole,
    startEdit,
    cancelEdit,
    formatForAI,
    reset
  }
}
