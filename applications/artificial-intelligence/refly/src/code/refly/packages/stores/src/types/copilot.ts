// Copilot types
export interface CopilotMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface CopilotConversation {
  id: string;
  title?: string;
  messages: CopilotMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface CopilotState {
  conversations: Record<string, CopilotConversation>;
  activeConversationId: string | null;
  isOpen: boolean;
}
