import { PromptService } from './service';
import type { IModelManager } from '../model/types';
import type { ITemplateManager } from '../template/types';
import type { IHistoryManager } from '../history/types';
import type { ILLMService } from '../llm/types';

/**
 * 创建PromptService实例
 * @param modelManager 模型管理器实例
 * @param llmService LLM服务实例
 * @param templateManager 模板管理器实例
 * @param historyManager 历史管理器实例
 * @returns PromptService实例
 */
export function createPromptService(
  modelManager: IModelManager,
  llmService: ILLMService,
  templateManager: ITemplateManager,
  historyManager: IHistoryManager
): PromptService {
  return new PromptService(modelManager, llmService, templateManager, historyManager);
}