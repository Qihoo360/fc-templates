import { createLLMService, ModelManager, LocalStorageProvider } from '../../../src/index.js';
import { expect, describe, it, beforeEach, beforeAll } from 'vitest';
import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
beforeAll(() => {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
});

describe('Gemini API 测试', () => {
  // 跳过没有设置 API 密钥的测试
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.log('跳过 Gemini 测试：未设置 VITE_GEMINI_API_KEY 环境变量');
    it.skip('应该能正确调用 Gemini API', () => {});
    it.skip('应该能正确处理多轮对话', () => {});
    return;
  }

  it('应该能正确调用 Gemini API', async () => {
    const storage = new LocalStorageProvider();
    const modelManager = new ModelManager(storage);
    const llmService = createLLMService(modelManager);

    // 更新 Gemini 配置
    await modelManager.updateModel('gemini', {
      apiKey,
      enabled: true
    });

    const messages = [
      { role: 'user', content: '你好，请用一句话介绍你自己' }
    ];

    const response = await llmService.sendMessage(messages, 'gemini');
    expect(response).toBeDefined();
    expect(typeof response).toBe('string');
    expect(response.length).toBeGreaterThan(0);
  }, 10000);

  it('应该能正确处理多轮对话', async () => {
    const storage = new LocalStorageProvider();
    const modelManager = new ModelManager(storage);
    const llmService = createLLMService(modelManager);

    // 更新 Gemini 配置
    await modelManager.updateModel('gemini', {
      apiKey,
      enabled: true
    });

    const messages = [
      { role: 'user', content: '你好，我们来玩个游戏' },
      { role: 'assistant', content: '好啊，你想玩什么游戏？' },
      { role: 'user', content: '我们来玩猜数字游戏，1到100之间' }
    ];

    const response = await llmService.sendMessage(messages, 'gemini');
    expect(response).toBeDefined();
    expect(typeof response).toBe('string');
    expect(response.length).toBeGreaterThan(0);
  }, 10000);
}); 