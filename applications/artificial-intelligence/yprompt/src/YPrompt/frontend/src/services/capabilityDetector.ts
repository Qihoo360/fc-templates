import type { ProviderConfig, ModelCapabilities, ReasoningType, SupportedParams } from '@/stores/settingsStore'
import { AIService } from './aiService'
import type { ChatMessage } from './aiService'

export class CapabilityDetector {
  private static instance: CapabilityDetector
  private testCache = new Map<string, ModelCapabilities>()
  private aiService = AIService.getInstance()

  private constructor() {}

  public static getInstance(): CapabilityDetector {
    if (!CapabilityDetector.instance) {
      CapabilityDetector.instance = new CapabilityDetector()
    }
    return CapabilityDetector.instance
  }

  async detectCapabilities(
    provider: ProviderConfig, 
    modelId: string,
    forceRefresh: boolean = false
  ): Promise<ModelCapabilities> {
    const cacheKey = `${provider.id}:${modelId}`
    
    // 检查缓存（24小时有效期）- 除非强制刷新
    if (!forceRefresh && this.testCache.has(cacheKey)) {
      const cached = this.testCache.get(cacheKey)!
      const age = Date.now() - (cached.testResult?.timestamp.getTime() || 0)
      if (age < 24 * 60 * 60 * 1000) { // 24小时缓存
        return cached
      }
    }
    
    // 执行检测
    const capabilities = await this.performCapabilityTest(provider, modelId)
    
    // 缓存结果
    this.testCache.set(cacheKey, capabilities)
    
    return capabilities
  }

  // 快速连接测试+异步思考检测
  async detectCapabilitiesWithCallback(
    provider: ProviderConfig, 
    modelId: string,
    onConnectionResult: (connected: boolean, responseTime: number, error?: string) => void,
    onThinkingResult: (capabilities: ModelCapabilities) => void,
    forceRefresh: boolean = false,
    abortController?: AbortController
  ): Promise<void> {
    const cacheKey = `${provider.id}:${modelId}`
    
    // 检查缓存 - 除非强制刷新
    if (!forceRefresh && this.testCache.has(cacheKey)) {
      const cached = this.testCache.get(cacheKey)!
      const age = Date.now() - (cached.testResult?.timestamp.getTime() || 0)
      if (age < 24 * 60 * 60 * 1000) {
        // 缓存有效，直接返回结果
        onConnectionResult(
          cached.testResult?.connected || false,
          cached.testResult?.responseTime || 0,
          cached.testResult?.error
        )
        onThinkingResult(cached)
        return
      }
    }
    
    const apiType = this.getAPIType(provider, modelId)
    const startTime = Date.now()
    
    try {
      // 检查是否已中断
      if (abortController?.signal.aborted) {
        return
      }
      
      // 第一阶段：快速连接测试
      const basicResult = await this.testBasicConnection(provider, modelId)
      const connectionTime = Date.now() - startTime
      
      // 检查是否已中断
      if (abortController?.signal.aborted) {
        return
      }
      
      onConnectionResult(basicResult.connected, connectionTime, basicResult.error)
      
      if (!basicResult.connected) {
        const failedCapabilities = this.createFailedCapabilities(basicResult, apiType)
        onThinkingResult(failedCapabilities)
        this.testCache.set(cacheKey, failedCapabilities)
        return
      }
      
      // 第二阶段：异步思考能力测试（不阻塞UI）
      const timeoutId = setTimeout(async () => {
        try {
          // 检查是否已中断
          if (abortController?.signal.aborted) {
            return
          }
          
          const thinkingResult = await this.testThinkingCapability(provider, modelId, apiType, basicResult.preferStream, abortController)
          
          // 再次检查是否已中断（因为 testThinkingCapability 可能是长时间运行的）
          if (abortController?.signal.aborted) {
            return
          }
          
          const finalCapabilities: ModelCapabilities = {
            reasoning: thinkingResult.reasoning,
            reasoningType: thinkingResult.reasoningType,
            supportedParams: thinkingResult.supportedParams,
            testResult: {
              connected: true,
              reasoning: thinkingResult.reasoning,
              responseTime: connectionTime,
              timestamp: new Date()
            }
          }
          
          // 缓存并回调最终结果
          this.testCache.set(cacheKey, finalCapabilities)
          onThinkingResult(finalCapabilities)
        } catch (thinkingError) {
          // 如果是中止错误，直接返回
          if (thinkingError instanceof Error && thinkingError.name === 'AbortError') {
            return
          }
          
          // 检查是否已中断
          if (abortController?.signal.aborted) {
            return
          }
          
          // 思考测试失败，但连接是成功的
          const partialCapabilities: ModelCapabilities = {
            reasoning: false,
            reasoningType: null,
            supportedParams: this.getDefaultCapabilities(apiType).supportedParams,
            testResult: {
              connected: true,
              reasoning: false,
              responseTime: connectionTime,
              timestamp: new Date()
            }
          }
          
          this.testCache.set(cacheKey, partialCapabilities)
          onThinkingResult(partialCapabilities)
        }
      }, 100) // 短暂延迟，让UI先更新连接状态
      
      // 监听中止信号，清理setTimeout
      if (abortController) {
        abortController.signal.addEventListener('abort', () => {
          clearTimeout(timeoutId)
        })
      }
      
    } catch (error) {
      const failedResult = {
        connected: false,
        error: error instanceof Error ? error.message : String(error)
      }
      
      onConnectionResult(false, Date.now() - startTime, failedResult.error)
      
      const failedCapabilities = this.createFailedCapabilities(failedResult, apiType)
      onThinkingResult(failedCapabilities)
      this.testCache.set(cacheKey, failedCapabilities)
    }
  }

  private async performCapabilityTest(
    provider: ProviderConfig, 
    modelId: string
  ): Promise<ModelCapabilities> {
    const apiType = this.getAPIType(provider, modelId)
    const startTime = Date.now()
    
    try {
      // 1. 基础连接测试
      const basicResult = await this.testBasicConnection(provider, modelId)
      if (!basicResult.connected) {
        return this.createFailedCapabilities(basicResult, apiType)
      }
      
      // 2. 思考能力测试
      const thinkingResult = await this.testThinkingCapability(provider, modelId, apiType, basicResult.preferStream)
      
      return {
        reasoning: thinkingResult.reasoning,
        reasoningType: thinkingResult.reasoningType,
        supportedParams: thinkingResult.supportedParams,
        testResult: {
          connected: true,
          reasoning: thinkingResult.reasoning,
          responseTime: Date.now() - startTime,
          timestamp: new Date()
        }
      }
    } catch (error) {
      return this.createFailedCapabilities({
        connected: false,
        error: error instanceof Error ? error.message : String(error)
      }, apiType)
    }
  }

  private async testBasicConnection(
    provider: ProviderConfig, 
    modelId: string
  ): Promise<{ connected: boolean; preferStream?: boolean; error?: string }> {
    const testMessages: ChatMessage[] = [
      { role: 'user', content: 'Hi' }
    ]
    
    try {
      // 方法1：优先尝试流式调用（现代AI API的主流方式）
      const streamResponse = await this.aiService.callAI(testMessages, provider, modelId, true)
      const streamConnected = Boolean(streamResponse && typeof streamResponse === 'string' && streamResponse.trim().length > 0)
      
      if (streamConnected) {
        return { connected: true, preferStream: true }
      }
    } catch (streamError) {
    }
    
    try {
      // 方法2：回退到非流式调用
      const response = await this.aiService.callAI(testMessages, provider, modelId, false)
      const connected = Boolean(response && typeof response === 'string' && response.trim().length > 0)
      
      if (connected) {
        return { connected: true, preferStream: false }
      }
    } catch (nonStreamError) {
      return {
        connected: false,
        error: nonStreamError instanceof Error ? nonStreamError.message : String(nonStreamError)
      }
    }
    
    return { connected: false, error: '流式和非流式测试都失败' }
  }

  private async testThinkingCapability(
    provider: ProviderConfig, 
    modelId: string, 
    apiType: string,
    preferStream?: boolean,
    abortController?: AbortController
  ): Promise<{
    reasoning: boolean
    reasoningType: ReasoningType | null
    supportedParams: SupportedParams
  }> {
    // 检查是否已中断
    if (abortController?.signal.aborted) {
      throw new Error('AbortError')
    }
    
    switch (apiType) {
      case 'openai':
        return await this.testOpenAIThinking(provider, modelId, preferStream, abortController)
      case 'google':
        return await this.testGeminiThinking(provider, modelId, preferStream, abortController)
      case 'anthropic':
        return await this.testClaudeThinking(provider, modelId, preferStream, abortController)
      default:
        return this.getDefaultCapabilities(apiType)
    }
  }

  private async testOpenAIThinking(
    provider: ProviderConfig, 
    modelId: string,
    preferStream?: boolean,
    abortController?: AbortController
  ): Promise<{
    reasoning: boolean
    reasoningType: ReasoningType | null
    supportedParams: SupportedParams
  }> {
    // 使用数学推理问题（业界最佳实践）
    const testMessage: ChatMessage[] = [{
      role: 'user',
      content: '一家商店原价100元的商品，先打8折，再打9折，最终价格是多少？请详细展示你的计算和推理过程。'
    }]
    
    try {
      // 检查是否已中断
      if (abortController?.signal.aborted) {
        throw new Error('AbortError')
      }
      
      // 检测是否为o1系列
      if (this.isO1Model(modelId)) {
        // o1系列模型的特殊检测逻辑
        const response = await this.callOpenAIWithO1Params(provider, modelId, testMessage)
        return {
          reasoning: !!response.choices?.[0]?.message?.reasoning,
          reasoningType: 'openai-reasoning',
          supportedParams: {
            temperature: false,
            maxTokens: 'max_completion_tokens',
            streaming: false,
            systemMessage: true
          }
        }
      }
      
      // 检查是否已中断
      if (abortController?.signal.aborted) {
        throw new Error('AbortError')
      }
      
      // 常规OpenAI模型的思考能力测试
      const response = await this.callOpenAIWithThinkingInstructions(provider, modelId, testMessage, preferStream)
      const hasThinking = this.detectThinkingInResponse(response, 'openai')
      
      return {
        reasoning: hasThinking,
        reasoningType: hasThinking ? 'generic-cot' : null,
        supportedParams: {
          temperature: true,
          maxTokens: 'max_tokens',
          streaming: true,
          systemMessage: true
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'AbortError') {
        throw error
      }
      return this.getDefaultCapabilities('openai')
    }
  }

  private async testGeminiThinking(
    provider: ProviderConfig, 
    modelId: string,
    preferStream?: boolean,
    abortController?: AbortController
  ): Promise<{
    reasoning: boolean
    reasoningType: ReasoningType | null
    supportedParams: SupportedParams
  }> {
    // Gemini的思考能力检测：通过API响应结构判断是否支持thought字段
    const testMessage: ChatMessage[] = [{
      role: 'user',
      content: '请思考并回答：什么是人工智能？'
    }]
    
    try {
      // 检查是否已中断
      if (abortController?.signal.aborted) {
        throw new Error('AbortError')
      }
      
      // 直接调用API，检查原始响应结构
      const rawResponse = await this.callGeminiAPIRaw(provider, modelId, testMessage, preferStream)
      
      // 检查是否已中断
      if (abortController?.signal.aborted) {
        throw new Error('AbortError')
      }
      
      // 检查响应中是否包含thought字段
      const hasThoughtField = this.detectGeminiThoughtField(rawResponse)
      
      // 如果没有检测到thought字段，通过模型名称判断是否为支持thinking的版本
      let hasThinking = hasThoughtField
      if (!hasThoughtField) {
        hasThinking = this.isGeminiThinkingModel(modelId)
      }
      
      return {
        reasoning: hasThinking,
        reasoningType: hasThinking ? 'gemini-thought' : null,
        supportedParams: {
          temperature: true,
          maxTokens: 'max_tokens',
          streaming: true,
          systemMessage: true
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'AbortError') {
        throw error
      }
      return this.getDefaultCapabilities('google')
    }
  }

  private async testClaudeThinking(
    provider: ProviderConfig, 
    modelId: string,
    preferStream?: boolean,
    abortController?: AbortController
  ): Promise<{
    reasoning: boolean
    reasoningType: ReasoningType | null
    supportedParams: SupportedParams
  }> {
    // Claude的思考能力检测：通过测试<thinking>标签是否被支持
    const testMessage: ChatMessage[] = [{
      role: 'user',
      content: '请用<thinking>标签展示你的思考过程，然后回答：什么是AI？'
    }]
    
    try {
      // 检查是否已中断
      if (abortController?.signal.aborted) {
        throw new Error('AbortError')
      }
      
      const response = await this.aiService.callAI(testMessage, provider, modelId, preferStream || false)
      
      // 检查是否已中断
      if (abortController?.signal.aborted) {
        throw new Error('AbortError')
      }
      
      // Claude的思考能力判断：检查响应中是否包含<thinking>标签
      const hasThinkingTags = typeof response === 'string' && 
                             (response.includes('<thinking>') && response.includes('</thinking>'))
      
      // 如果没有thinking标签，尝试检测是否是支持thinking的Claude模型
      let hasThinking = hasThinkingTags
      if (!hasThinkingTags) {
        // 某些Claude模型支持thinking但可能不会在简单测试中使用
        // 通过模型名称判断是否为支持thinking的版本
        hasThinking = this.isClaudeThinkingModel(modelId)
      }
      
      return {
        reasoning: hasThinking,
        reasoningType: hasThinking ? 'claude-thinking' : null,
        supportedParams: {
          temperature: true,
          maxTokens: 'max_tokens',
          streaming: true,
          systemMessage: true
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'AbortError') {
        throw error
      }
      return this.getDefaultCapabilities('anthropic')
    }
  }

  // 辅助方法
  private getAPIType(provider: ProviderConfig, modelId: string): string {
    const model = provider.models.find(m => m.id === modelId)
    return model?.apiType || provider.type
  }

  private isO1Model(modelId: string): boolean {
    return modelId.toLowerCase().includes('o1')
  }

  private isClaudeThinkingModel(modelId: string): boolean {
    const modelName = modelId.toLowerCase()
    // Claude 3.5及以上版本支持thinking标签和多模态（图片+PDF文档最多100页）
    return modelName.includes('claude-3.5') || 
           modelName.includes('claude-3.7') ||
           modelName.includes('claude-4') ||
           modelName.includes('sonnet') ||
           modelName.includes('opus')
  }

  private isGeminiThinkingModel(modelId: string): boolean {
    const modelName = modelId.toLowerCase()
    // Gemini 2.0以上版本支持thought字段
    return modelName.includes('gemini-2.') || 
           modelName.includes('gemini-pro') ||
           modelName.includes('thinking') ||
           modelName.includes('exp')
  }

  private detectGeminiThoughtField(response: any): boolean {
    try {
      // 如果响应是字符串，尝试解析为JSON
      if (typeof response === 'string') {
        try {
          response = JSON.parse(response)
        } catch {
          return false
        }
      }

      // 检查Gemini API响应结构中的thought字段
      if (response && response.candidates && Array.isArray(response.candidates)) {
        for (const candidate of response.candidates) {
          if (candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
              if (part.thought) {
                return true
              }
            }
          }
        }
      }

      return false
    } catch {
      return false
    }
  }

  private detectThinkingInResponse(response: any, apiType: string): boolean {
    if (typeof response !== 'string') {
      return false
    }
    
    const responseText = response.toLowerCase()
    
    switch (apiType) {
      case 'openai':
        return this.detectOpenAIThinking(response)
      case 'google':
        return responseText.includes('思考') || responseText.includes('分析') || responseText.includes('reasoning') || 
               this.hasStructuredThinking(response)
      case 'anthropic':
        return responseText.includes('<thinking>') || responseText.includes('让我思考') || 
               responseText.includes('分析') || this.hasStructuredThinking(response)
      default:
        return false
    }
  }

  private detectOpenAIThinking(response: string): boolean {
    const responseText = response.toLowerCase()
    
    // 思考过程指示词（基于最佳实践）
    const thinkingIndicators = [
      // 直接思考标记
      '<thinking>', 'thinking:', '思考：', '分析：', '推理：',
      
      // 步骤性词汇  
      '首先', '然后', '接着', '最后', '第一步', '第二步', '第三步',
      'step 1', 'step 2', 'step 3', '步骤1', '步骤2',
      
      // 计算过程词汇
      '计算', '计算过程', '解题', '推导', '验证',
      '原价', '打折', '折扣', '最终价格',
      
      // 分析性词汇
      '让我', '我需要', '我们来', '分析一下', '考虑到',
      '因此', '所以', '由此可见', '可以得出',
      
      // 推理过程
      '根据', '基于', '考虑', '假设', '如果', '那么'
    ]
    
    // 计算匹配的指示词数量
    const indicatorCount = thinkingIndicators.filter(indicator => 
      responseText.includes(indicator)
    ).length
    
    // 检查是否有结构化思考
    const hasStructure = this.hasStructuredThinking(response)
    
    // 检查是否有数学计算过程
    const hasMathProcess = this.hasMathematicalReasoning(response)
    
    // 综合判断：
    // 1. 至少2个思考指示词 + 结构化思维
    // 2. 至少3个思考指示词（即使没有明显结构）
    // 3. 有明确的数学推理过程
    // 4. 有thinking标签或明确的分析过程
    return (indicatorCount >= 2 && hasStructure) || 
           (indicatorCount >= 3) ||
           hasMathProcess ||
           responseText.includes('<thinking>') ||
           responseText.includes('分析过程')
  }

  private hasStructuredThinking(response: string): boolean {
    // 检查是否有编号列表 (1. 2. 3. 或 一、二、三、或 步骤1、步骤2)
    const hasNumberedList = /[1-9]\.|[一二三四五]\s*、|步骤\s*[1-9]/.test(response)
    
    // 检查是否有多段落结构（超过2个换行）
    const paragraphCount = response.split('\n').filter(line => line.trim().length > 0).length
    const hasMultipleParagraphs = paragraphCount > 2
    
    // 检查逻辑连接词密度
    const logicalWords = ['因为', '所以', '然而', '但是', '因此', '由于', '由此', '可见']
    const logicalWordCount = logicalWords.filter(word => response.includes(word)).length
    
    return hasNumberedList || (hasMultipleParagraphs && logicalWordCount >= 2)
  }

  private hasMathematicalReasoning(response: string): boolean {
    // 检查是否包含数学计算过程
    const mathPatterns = [
      /\d+\s*[×*]\s*\d+/,           // 乘法：100 × 0.8
      /\d+\s*[÷/]\s*\d+/,           // 除法：100 ÷ 2  
      /\d+\s*[+]\s*\d+/,            // 加法：80 + 20
      /\d+\s*[-]\s*\d+/,            // 减法：100 - 20
      /=\s*\d+/,                    // 等号结果：= 72
      /0\.\d+/,                     // 小数：0.8, 0.9
      /\d+%/,                       // 百分比：80%
      /打.*折/,                     // 打折：打8折
      /折扣/,                       // 折扣词汇
    ]
    
    return mathPatterns.some(pattern => pattern.test(response))
  }

  private getDefaultCapabilities(apiType: string): {
    reasoning: boolean
    reasoningType: ReasoningType | null
    supportedParams: SupportedParams
  } {
    const defaultParams: SupportedParams = {
      temperature: true,
      maxTokens: 'max_tokens',
      streaming: true,
      systemMessage: true
    }

    if (apiType === 'openai') {
      return {
        reasoning: false,
        reasoningType: null,
        supportedParams: { ...defaultParams }
      }
    } else if (apiType === 'google') {
      return {
        reasoning: false,
        reasoningType: null,
        supportedParams: { ...defaultParams }
      }
    } else if (apiType === 'anthropic') {
      return {
        reasoning: false,
        reasoningType: null,
        supportedParams: { ...defaultParams }
      }
    }

    return {
      reasoning: false,
      reasoningType: null,
      supportedParams: defaultParams
    }
  }

  private createFailedCapabilities(
    basicResult: { connected: boolean; error?: string }, 
    apiType: string
  ): ModelCapabilities {
    return {
      reasoning: false,
      reasoningType: null,
      supportedParams: this.getDefaultCapabilities(apiType).supportedParams,
      testResult: {
        connected: basicResult.connected,
        reasoning: false,
        responseTime: 0,
        error: basicResult.error,
        timestamp: new Date()
      }
    }
  }

  // OpenAI o1系列模型的特殊调用方法
  private async callOpenAIWithO1Params(
    provider: ProviderConfig, 
    modelId: string, 
    messages: ChatMessage[]
  ): Promise<any> {
    // 直接调用OpenAI API以检测o1系列的reasoning字段
    try {
      if (!provider.baseUrl) {
        throw new Error('API URL 未配置')
      }
      
      let apiUrl = provider.baseUrl.trim()
      if (apiUrl.includes('/chat/completions')) {
        // 已经是完整URL，直接使用
      } else if (apiUrl.includes('/v1')) {
        apiUrl = apiUrl.replace(/\/+$/, '') + '/chat/completions'
      } else {
        apiUrl = apiUrl.replace(/\/+$/, '') + '/v1/chat/completions'
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify({
          model: modelId,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          max_completion_tokens: 100 // o1系列使用max_completion_tokens
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      throw error
    }
  }

  private async callOpenAIWithThinkingInstructions(
    provider: ProviderConfig, 
    modelId: string, 
    messages: ChatMessage[],
    preferStream?: boolean
  ): Promise<any> {
    // 使用最佳实践的思考指令
    const enhancedMessages: ChatMessage[] = [
      { 
        role: 'system', 
        content: '请在回答问题时展示你的完整思考过程。包括：1）分析问题 2）制定解决步骤 3）执行计算或推理 4）验证答案。请明确标出每个步骤。'
      },
      ...messages
    ]
    return await this.aiService.callAI(enhancedMessages, provider, modelId, preferStream || false)
  }


  private async callGeminiAPIRaw(
    provider: ProviderConfig, 
    modelId: string, 
    messages: ChatMessage[],
    _preferStream?: boolean
  ): Promise<any> {
    // 直接调用Gemini API以获取原始响应结构
    try {
      // 构建Gemini API URL
      if (!provider.baseUrl) {
        throw new Error('API URL 未配置')
      }
      let apiUrl = provider.baseUrl.trim()
      
      // 确保以/v1beta结尾，然后拼接模型路径
      if (!apiUrl.endsWith('/v1beta')) {
        if (apiUrl.includes('/models/')) {
          apiUrl = apiUrl.split('/models/')[0]
        }
        if (!apiUrl.endsWith('/v1beta')) {
          apiUrl = apiUrl.replace(/\/+$/, '') + '/v1beta'
        }
      }
      
      // 拼接模型特定路径
      apiUrl = `${apiUrl}/models/${modelId}:generateContent`
      
      // 添加API key参数
      const url = new URL(apiUrl)
      url.searchParams.set('key', provider.apiKey)
      
      // 转换消息格式
      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))

      const requestBody = {
        contents,
        generationConfig: {
          temperature: 0.7
        }
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      throw error
    }
  }


  // 清理缓存
  public clearCache(): void {
    this.testCache.clear()
  }

  // 获取缓存统计
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.testCache.size,
      keys: Array.from(this.testCache.keys())
    }
  }
}