import { PromptRecord } from '../history/types';
import { StreamHandlers } from '../llm/types';

/**
 * 优化模式枚举
 * 用于区分不同的提示词优化类型
 */
export type OptimizationMode = 'system' | 'user';

/**
 * 优化请求接口
 */
export interface OptimizationRequest {
  optimizationMode: OptimizationMode;
  targetPrompt: string;           // 待优化的提示词
  templateId?: string;
  modelKey: string;
}

/**
 * 提示词服务接口
 */
export interface IPromptService {
  /** 优化提示词 - 支持提示词类型和增强功能 */
  optimizePrompt(request: OptimizationRequest): Promise<string>;
  
  /** 迭代优化提示词 */
  iteratePrompt(
    originalPrompt: string,
    lastOptimizedPrompt: string,
    iterateInput: string,
    modelKey: string,
    templateId?: string
  ): Promise<string>;
  
  /** 测试提示词 - 支持可选系统提示词 */
  testPrompt(
    systemPrompt: string,
    userPrompt: string,
    modelKey: string
  ): Promise<string>;
  
  /** 获取历史记录 */
  getHistory(): Promise<PromptRecord[]>;
  
  /** 获取迭代链 */
  getIterationChain(recordId: string): Promise<PromptRecord[]>;

  /** 优化提示词（流式）- 支持提示词类型和增强功能 */
  optimizePromptStream(
    request: OptimizationRequest,
    callbacks: StreamHandlers
  ): Promise<void>;

  /** 迭代优化提示词（流式） */
  iteratePromptStream(
    originalPrompt: string,
    lastOptimizedPrompt: string,
    iterateInput: string,
    modelKey: string,
    handlers: StreamHandlers,
    templateId: string
  ): Promise<void>;

  /** 测试提示词（流式）- 支持可选系统提示词 */
  testPromptStream(
    systemPrompt: string,
    userPrompt: string,
    modelKey: string,
    callbacks: StreamHandlers
  ): Promise<void>;
}

export type { StreamHandlers }; 