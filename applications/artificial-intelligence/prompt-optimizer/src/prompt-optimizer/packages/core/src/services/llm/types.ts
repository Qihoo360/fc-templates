import { ModelConfig } from '../model/types';
/**
 * 消息角色类型
 */
export type MessageRole = 'system' | 'user' | 'assistant';

/**
 * 消息类型
 */
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * LLM响应结构
 */
export interface LLMResponse {
  content: string;
  reasoning?: string;
  metadata?: {
    model?: string;
    tokens?: number;
    finishReason?: string;
  };
}

/**
 * 流式响应处理器
 * 支持传统格式和结构化格式
 */
export interface StreamHandlers {
  // 主要内容流（必需，向后兼容）
  onToken: (token: string) => void;
  
  // 推理内容流（可选，新增功能）
  onReasoningToken?: (token: string) => void;
  
  // 完成回调（现在传递完整响应，向后兼容通过可选参数）
  onComplete: (response?: LLMResponse) => void;
  
  // 错误回调
  onError: (error: Error) => void;
}

/**
 * 模型信息接口
 */
export interface ModelInfo {
  id: string;  // 模型ID，用于API调用
  name: string; // 显示名称
}

/**
 * 用于下拉选择组件的模型选项格式
 */
export interface ModelOption {
  value: string; // 选项值，通常是模型ID
  label: string; // 显示标签，通常是模型名称
}

/**
 * LLM服务接口
 */
export interface ILLMService {
  /**
   * 发送消息（传统格式，返回合并的字符串）
   * @deprecated 建议使用 sendMessageStructured 获得更好的语义支持
   * @throws {RequestConfigError} 当参数无效时
   * @throws {APIError} 当请求失败时
   */
  sendMessage(messages: Message[], provider: string): Promise<string>;

  /**
   * 发送消息（结构化格式）
   * @throws {RequestConfigError} 当参数无效时
   * @throws {APIError} 当请求失败时
   */
  sendMessageStructured(messages: Message[], provider: string): Promise<LLMResponse>;



  /**
   * 发送流式消息（支持结构化和传统格式）
   * @throws {RequestConfigError} 当参数无效时
   * @throws {APIError} 当请求失败时
   */
  sendMessageStream(
    messages: Message[],
    provider: string,
    callbacks: StreamHandlers
  ): Promise<void>;

  /**
   * 测试连接
   */
  testConnection(provider: string): Promise<void>;

  /**
   * 获取模型列表，以下拉选项格式返回
   * @param provider 提供商标识
   * @param customConfig 自定义配置（可选）
   * @throws {RequestConfigError} 当参数无效时
   * @throws {APIError} 当请求失败时
   */
  fetchModelList(provider: string, customConfig?: Partial<ModelConfig>): Promise<ModelOption[]>;
}