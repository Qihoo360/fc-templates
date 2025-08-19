import {
  IPromptService,
  OptimizationRequest,
  StreamHandlers,
} from './types';
import { PromptRecord } from '../history/types';
import { safeSerializeForIPC } from '../../utils/ipc-serialization';

// Helper function to check if running in Electron renderer process
function isRunningInElectron(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).electronAPI !== 'undefined';
}

/**
 * Proxy for using PromptService in Electron renderer process.
 * It communicates with the main process via IPC.
 */
export class ElectronPromptServiceProxy implements IPromptService {
  private get api() {
    if (!isRunningInElectron() || !(window as any).electronAPI?.prompt) {
      // The `prompt` property will be added to the electronAPI in the desktop package's preload script.
      // This error indicates a potential mismatch between frontend expectations and the preload script's exposure.
      throw new Error('Electron Prompt API is not available in this environment.');
    }
    return (window as any).electronAPI.prompt;
  }

  private get ipc() {
    if (!isRunningInElectron() || !(window as any).electronAPI) {
      throw new Error('Electron API is not available in this environment.');
    }
    return (window as any).electronAPI;
  }

  async optimizePrompt(request: OptimizationRequest): Promise<string> {
    // 自动序列化，防止Vue响应式对象IPC传递错误
    const safeRequest = safeSerializeForIPC(request);
    return this.api.optimizePrompt(safeRequest);
  }

  async iteratePrompt(
    originalPrompt: string,
    lastOptimizedPrompt: string,
    iterateInput: string,
    modelKey: string,
    templateId?: string
  ): Promise<string> {
    return this.api.iteratePrompt(originalPrompt, lastOptimizedPrompt, iterateInput, modelKey, templateId);
  }

  async testPrompt(
    systemPrompt: string,
    userPrompt: string,
    modelKey: string
  ): Promise<string> {
    return this.api.testPrompt(systemPrompt, userPrompt, modelKey);
  }

  async getHistory(): Promise<PromptRecord[]> {
    return this.api.getHistory();
  }

  async getIterationChain(recordId: string): Promise<PromptRecord[]> {
    return this.api.getIterationChain(recordId);
  }

  // Streaming methods are complex over IPC and are not implemented in the proxy for now.
  // They would require event-based communication rather than a simple invoke/handle.
  async optimizePromptStream(request: OptimizationRequest, callbacks: StreamHandlers): Promise<void> {
    const streamId = `opt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const tokenHandler = (token: string) => callbacks.onToken(token);
    const reasoningTokenHandler = (token: string) => callbacks.onReasoningToken?.(token);
    const finishHandler = () => {
      cleanup();
      callbacks.onComplete();
    };
    const errorHandler = (error: string) => {
      cleanup();
      callbacks.onError(new Error(error));
    };

    const cleanup = () => {
      this.ipc.off(`stream-token-${streamId}`, tokenHandler);
      this.ipc.off(`stream-reasoning-token-${streamId}`, reasoningTokenHandler);
      this.ipc.off(`stream-finish-${streamId}`, finishHandler);
      this.ipc.off(`stream-error-${streamId}`, errorHandler);
    };

    this.ipc.on(`stream-token-${streamId}`, tokenHandler);
    this.ipc.on(`stream-reasoning-token-${streamId}`, reasoningTokenHandler);
    this.ipc.on(`stream-finish-${streamId}`, finishHandler);
    this.ipc.on(`stream-error-${streamId}`, errorHandler);

    try {
      await this.api.optimizePromptStream(request, streamId);
    } catch (error) {
      cleanup();
      callbacks.onError(error as Error);
    }
  }

  async iteratePromptStream(
    originalPrompt: string,
    lastOptimizedPrompt: string,
    iterateInput: string,
    modelKey: string,
    callbacks: StreamHandlers,
    templateId?: string
  ): Promise<void> {
    const streamId = `iter-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const tokenHandler = (token: string) => callbacks.onToken(token);
    const reasoningTokenHandler = (token: string) => callbacks.onReasoningToken?.(token);
    const finishHandler = () => {
      cleanup();
      callbacks.onComplete();
    };
    const errorHandler = (error: string) => {
      cleanup();
      callbacks.onError(new Error(error));
    };

    const cleanup = () => {
      this.ipc.off(`stream-token-${streamId}`, tokenHandler);
      this.ipc.off(`stream-reasoning-token-${streamId}`, reasoningTokenHandler);
      this.ipc.off(`stream-finish-${streamId}`, finishHandler);
      this.ipc.off(`stream-error-${streamId}`, errorHandler);
    };

    this.ipc.on(`stream-token-${streamId}`, tokenHandler);
    this.ipc.on(`stream-reasoning-token-${streamId}`, reasoningTokenHandler);
    this.ipc.on(`stream-finish-${streamId}`, finishHandler);
    this.ipc.on(`stream-error-${streamId}`, errorHandler);

    try {
      await this.api.iteratePromptStream(originalPrompt, lastOptimizedPrompt, iterateInput, modelKey, templateId, streamId);
    } catch (error) {
      cleanup();
      callbacks.onError(error as Error);
    }
  }

  async testPromptStream(
    systemPrompt: string,
    userPrompt: string,
    modelKey: string,
    callbacks: StreamHandlers
  ): Promise<void> {
    const streamId = `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const tokenHandler = (token: string) => callbacks.onToken(token);
    const reasoningTokenHandler = (token: string) => callbacks.onReasoningToken?.(token);
    const finishHandler = () => {
      cleanup();
      callbacks.onComplete();
    };
    const errorHandler = (error: string) => {
      cleanup();
      callbacks.onError(new Error(error));
    };

    const cleanup = () => {
      this.ipc.off(`stream-token-${streamId}`, tokenHandler);
      this.ipc.off(`stream-reasoning-token-${streamId}`, reasoningTokenHandler);
      this.ipc.off(`stream-finish-${streamId}`, finishHandler);
      this.ipc.off(`stream-error-${streamId}`, errorHandler);
    };

    this.ipc.on(`stream-token-${streamId}`, tokenHandler);
    this.ipc.on(`stream-reasoning-token-${streamId}`, reasoningTokenHandler);
    this.ipc.on(`stream-finish-${streamId}`, finishHandler);
    this.ipc.on(`stream-error-${streamId}`, errorHandler);

    try {
      await this.api.testPromptStream(systemPrompt, userPrompt, modelKey, streamId);
    } catch (error) {
      cleanup();
      callbacks.onError(error as Error);
    }
  }
} 