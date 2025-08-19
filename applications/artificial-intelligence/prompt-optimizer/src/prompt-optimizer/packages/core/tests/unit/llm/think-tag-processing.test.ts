import { describe, it, expect, vi } from 'vitest';
import { LLMService } from '../../../src/services/llm/service';
import { ModelManager } from '../../../src/services/model/manager';
import { LocalStorageProvider } from '../../../src/services/storage/localStorageProvider';

describe('Think标签处理测试', () => {

  describe('流式处理', () => {
    it('应该能正确处理流式think标签：开始标签 -> 推理内容 -> 结束标签 -> 正文', () => {
      const storage = new LocalStorageProvider();
      const modelManager = new ModelManager(storage);
      const llmService = new LLMService(modelManager);

      const mockCallbacks = {
        onToken: vi.fn(),
        onReasoningToken: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn()
      };

      const thinkState = { isInThinkMode: false, buffer: '' };

      // 模拟流式处理：分多个chunk接收
      // Chunk 1: 开始标签
      (llmService as any).processStreamContentWithThinkTags('<think>', mockCallbacks, thinkState);
      
      // Chunk 2: 推理内容第一部分
      (llmService as any).processStreamContentWithThinkTags('我需要思考', mockCallbacks, thinkState);
      
      // Chunk 3: 推理内容第二部分
      (llmService as any).processStreamContentWithThinkTags('这个问题', mockCallbacks, thinkState);
      
      // Chunk 4: 结束标签
      (llmService as any).processStreamContentWithThinkTags('</think>', mockCallbacks, thinkState);
      
      // Chunk 5: 正文内容
      (llmService as any).processStreamContentWithThinkTags('这是最终答案', mockCallbacks, thinkState);

      // 验证推理内容被正确分离
      expect(mockCallbacks.onReasoningToken).toHaveBeenCalledWith('我需要思考');
      expect(mockCallbacks.onReasoningToken).toHaveBeenCalledWith('这个问题');
      
      // 验证正文内容被正确发送
      expect(mockCallbacks.onToken).toHaveBeenCalledWith('这是最终答案');
      
      // 验证没有将标签内容发送到主流
      expect(mockCallbacks.onToken).not.toHaveBeenCalledWith('<think>');
      expect(mockCallbacks.onToken).not.toHaveBeenCalledWith('</think>');
    });

    it('应该能处理单个chunk包含完整think标签的情况', () => {
      const storage = new LocalStorageProvider();
      const modelManager = new ModelManager(storage);
      const llmService = new LLMService(modelManager);

      const mockCallbacks = {
        onToken: vi.fn(),
        onReasoningToken: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn()
      };

      const thinkState = { isInThinkMode: false, buffer: '' };

      // 单个chunk包含完整的think标签
      (llmService as any).processStreamContentWithThinkTags(
        '前面内容<think>推理过程</think>后面内容', 
        mockCallbacks, 
        thinkState
      );

      expect(mockCallbacks.onToken).toHaveBeenCalledWith('前面内容');
      expect(mockCallbacks.onReasoningToken).toHaveBeenCalledWith('推理过程');
      expect(mockCallbacks.onToken).toHaveBeenCalledWith('后面内容');
    });

    it('应该能处理跨chunk的think标签', () => {
      const storage = new LocalStorageProvider();
      const modelManager = new ModelManager(storage);
      const llmService = new LLMService(modelManager);

      const mockCallbacks = {
        onToken: vi.fn(),
        onReasoningToken: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn()
      };

      const thinkState = { isInThinkMode: false, buffer: '' };

      // Chunk 1: 包含开始标签的一部分
      (llmService as any).processStreamContentWithThinkTags('前面<thi', mockCallbacks, thinkState);
      
      // Chunk 2: 完成开始标签并开始推理内容
      (llmService as any).processStreamContentWithThinkTags('nk>推理开始', mockCallbacks, thinkState);
      
      // Chunk 3: 推理内容和部分结束标签
      (llmService as any).processStreamContentWithThinkTags('推理结束</thi', mockCallbacks, thinkState);
      
      // Chunk 4: 完成结束标签并开始正文
      (llmService as any).processStreamContentWithThinkTags('nk>正文内容', mockCallbacks, thinkState);

      expect(mockCallbacks.onToken).toHaveBeenCalledWith('前面');
      expect(mockCallbacks.onReasoningToken).toHaveBeenCalledWith('推理开始');
      expect(mockCallbacks.onReasoningToken).toHaveBeenCalledWith('推理结束');
      expect(mockCallbacks.onToken).toHaveBeenCalledWith('正文内容');
    });

    it('应该能处理没有推理回调的流式情况', () => {
      const storage = new LocalStorageProvider();
      const modelManager = new ModelManager(storage);
      const llmService = new LLMService(modelManager);

      const mockCallbacks = {
        onToken: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn()
        // 注意：没有 onReasoningToken
      };

      const thinkState = { isInThinkMode: false, buffer: '' };

      (llmService as any).processStreamContentWithThinkTags(
        '<think>推理过程</think>正文内容', 
        mockCallbacks, 
        thinkState
      );

      // 当没有推理回调时，应该直接发送原始内容
      expect(mockCallbacks.onToken).toHaveBeenCalledWith('<think>推理过程</think>正文内容');
    });
  });
}); 