// Placeholder types to resolve missing imports during migration

export interface XYPosition {
  x: number;
  y: number;
}

// Canvas types
export interface CanvasNode<T = any> {
  id: string;
  type?: string;
  position: XYPosition;
  data: T;
  [key: string]: any;
}

export interface CanvasNodeData<T = any> {
  [key: string]: any;
  metadata?: T;
}

export interface ResponseNodeMeta {
  title?: string;
  content?: string;
  [key: string]: any;
}

// Copilot types
export interface CopilotMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
}

// API types
export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

// Project types
export interface ProjectDirectory {
  id: string;
  name: string;
  type: 'folder' | 'file';
  children?: ProjectDirectory[];
}

// I18n types
export type Locale = 'en' | 'zh' | string;

// Common utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
