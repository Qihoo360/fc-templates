import type { MessageAttachment } from '@/stores/promptStore'

export interface MessageContent {
  type: 'text' | 'image_url' | 'image' | 'document' | 'audio' | 'video'
  text?: string
  source?: {
    type: string
    media_type: string
    data: string
  }
  inline_data?: {
    mime_type: string
    data: string
  }
  image_url?: {
    url: string
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string | MessageContent[]
  attachments?: MessageAttachment[]
}

export interface AIResponse {
  content: string
  finishReason?: string
}

// Re-export ProviderConfig from settingsStore for consistency
export type { ProviderConfig } from '@/stores/settingsStore'

export interface StreamChunk {
  content: string
  done: boolean
}

export interface AIProviderOptions {
  apiKey: string
  baseUrl?: string
  model: string
  temperature?: number
  maxTokens?: number
  timeout?: number
}

// API 调用参数（从 ModelParams 传入）
export interface APICallParams {
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  topK?: number
}
