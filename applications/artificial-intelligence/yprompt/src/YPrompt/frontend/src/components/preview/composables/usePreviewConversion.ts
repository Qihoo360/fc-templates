import { ref, computed } from 'vue'
import { usePromptStore } from '@/stores/promptStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { AIService, type ChatMessage } from '@/services/aiService'
import { cleanAIResponseForFormatting, cleanConvertedResponse } from '@/utils/aiResponseUtils'

export function usePreviewConversion() {
  const promptStore = usePromptStore()
  const settingsStore = useSettingsStore()
  const notificationStore = useNotificationStore()
  const aiService = AIService.getInstance()

  const isConvertingFormat = ref(false)
  const isConvertingLanguage = ref(false)
  const formatState = ref<'markdown' | 'xml'>('markdown')
  const languageState = ref<'zh' | 'en'>('zh')

  // 获取当前生成的提示词（支持三种格式）
  const currentGeneratedPrompt = computed({
    get: () => {
      const prompt = promptStore.promptData.generatedPrompt
      
      // 旧格式1: 纯字符串
      if (typeof prompt === 'string') {
        return prompt
      }
      
      // 新格式: 二维对象 { markdown: {zh, en}, xml: {zh, en} }
      if ('markdown' in prompt && 'xml' in prompt) {
        const format = formatState.value
        return languageState.value === 'zh' 
          ? prompt[format].zh 
          : prompt[format].en
      }
      
      // 旧格式2: 一维对象 {zh, en}
      return languageState.value === 'zh' 
        ? prompt.zh 
        : prompt.en
    },
    set: (value: string) => {
      const prompt = promptStore.promptData.generatedPrompt
      
      // 如果是纯字符串，直接设置
      if (typeof prompt === 'string') {
        promptStore.promptData.generatedPrompt = value
        return
      }
      
      // 如果是二维对象
      if ('markdown' in prompt && 'xml' in prompt) {
        const format = formatState.value
        if (languageState.value === 'zh') {
          prompt[format].zh = value
        } else {
          prompt[format].en = value
        }
        return
      }
      
      // 如果是一维对象
      if (languageState.value === 'zh') {
        prompt.zh = value
      } else {
        prompt.en = value
      }
    }
  })

  // 切换格式（Markdown <-> XML）- 带缓存机制
  const toggleFormat = async () => {
    if (!currentGeneratedPrompt.value || isConvertingFormat.value || isConvertingLanguage.value) {
      return
    }

    const targetFormatCode = formatState.value === 'markdown' ? 'xml' : 'markdown'
    const prompt = promptStore.promptData.generatedPrompt
    
    // 如果已经是二维对象且目标格式已缓存，直接切换
    if (typeof prompt !== 'string' && 'markdown' in prompt && 'xml' in prompt) {
      const targetContent = languageState.value === 'zh' 
        ? prompt[targetFormatCode].zh 
        : prompt[targetFormatCode].en
      
      if (targetContent) {
        formatState.value = targetFormatCode
        notificationStore.success(`已切换为${targetFormatCode === 'xml' ? 'XML' : 'Markdown'}格式`)
        return
      }
    }

    const provider = settingsStore.getCurrentProvider()
    const model = settingsStore.getCurrentModel()

    if (!provider || !model) {
      notificationStore.error('请先配置AI模型')
      return
    }

    try {
      isConvertingFormat.value = true
      const targetFormat = formatState.value === 'markdown' ? 'XML' : 'Markdown'
      const currentFormat = formatState.value === 'markdown' ? 'Markdown' : 'XML'

      // 清理内容中可能的 AI 思考标签
      const cleanedContent = cleanAIResponseForFormatting(currentGeneratedPrompt.value)

      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `你是一个专业的提示词格式转换助手。你的任务是将提示词从${currentFormat}格式转换为${targetFormat}格式，保持内容完全一致，只改变格式样式。

**重要规则**：
1. **绝对不能添加、删除或修改任何实质性内容**
2. **只能改变格式标记（如 Markdown 的 # 标题改为 XML 的 <section> 标签）**
3. **必须保留原文的所有信息和语义**
4. **不要添加任何解释、说明或额外的文字**
5. **直接输出转换后的结果，不要包含任何前言或后记**

${targetFormat === 'XML' 
  ? '使用 <prompt>, <section>, <rule>, <example> 等 XML 标签组织内容。'
  : '使用 Markdown 语法：# 标题，- 列表，**粗体** 等组织内容。'
}`
        },
        {
          role: 'user',
          content: `请将以下提示词从${currentFormat}格式转换为${targetFormat}格式：

${cleanedContent}`
        }
      ]

      const response = await aiService.callAI(
        messages,
        provider,
        model.id,
        false
      )

      if (response && response.trim()) {
        const cleaned = cleanConvertedResponse(response)
        
        // 升级到二维对象格式
        if (typeof prompt === 'string') {
          // 从字符串升级
          const currentLang = languageState.value
          promptStore.promptData.generatedPrompt = {
            markdown: {
              zh: formatState.value === 'markdown' && currentLang === 'zh' ? prompt : '',
              en: formatState.value === 'markdown' && currentLang === 'en' ? prompt : ''
            },
            xml: {
              zh: formatState.value === 'xml' && currentLang === 'zh' ? prompt : '',
              en: formatState.value === 'xml' && currentLang === 'en' ? prompt : ''
            }
          }
          // 保存转换结果
          if (languageState.value === 'zh') {
            promptStore.promptData.generatedPrompt[targetFormatCode].zh = cleaned
          } else {
            promptStore.promptData.generatedPrompt[targetFormatCode].en = cleaned
          }
        } else if (!('markdown' in prompt)) {
          // 从一维对象升级
          promptStore.promptData.generatedPrompt = {
            markdown: {
              zh: formatState.value === 'markdown' ? prompt.zh : '',
              en: formatState.value === 'markdown' ? prompt.en : ''
            },
            xml: {
              zh: formatState.value === 'xml' ? prompt.zh : '',
              en: formatState.value === 'xml' ? prompt.en : ''
            }
          }
          // 保存转换结果
          if (languageState.value === 'zh') {
            promptStore.promptData.generatedPrompt[targetFormatCode].zh = cleaned
          } else {
            promptStore.promptData.generatedPrompt[targetFormatCode].en = cleaned
          }
        } else {
          // 已经是二维对象，直接保存
          if (languageState.value === 'zh') {
            prompt[targetFormatCode].zh = cleaned
          } else {
            prompt[targetFormatCode].en = cleaned
          }
        }
        
        formatState.value = targetFormatCode
        notificationStore.success(`已转换为${targetFormat}格式`)
      } else {
        notificationStore.error('格式转换失败：返回内容为空')
      }
    } catch (error) {
      notificationStore.error('格式转换失败，请重试')
    } finally {
      isConvertingFormat.value = false
    }
  }

  // 切换语言（中文 <-> 英文）- 支持二维对象
  const toggleLanguage = async () => {
    if (!currentGeneratedPrompt.value || isConvertingFormat.value || isConvertingLanguage.value) {
      return
    }

    const targetLangCode = languageState.value === 'zh' ? 'en' : 'zh'
    const prompt = promptStore.promptData.generatedPrompt
    
    // 如果已经是二维对象且目标语言已缓存，直接切换
    if (typeof prompt !== 'string' && 'markdown' in prompt && 'xml' in prompt) {
      const targetContent = prompt[formatState.value][targetLangCode]
      if (targetContent) {
        languageState.value = targetLangCode
        notificationStore.success(`已切换为${targetLangCode === 'zh' ? '中文' : '英文'}版本`)
        return
      }
    }
    
    // 如果是一维对象且目标语言已缓存，直接切换
    if (typeof prompt !== 'string' && !('markdown' in prompt)) {
      if (targetLangCode === 'zh' && prompt.zh) {
        languageState.value = 'zh'
        notificationStore.success('已切换为中文版本')
        return
      }
      if (targetLangCode === 'en' && prompt.en) {
        languageState.value = 'en'
        notificationStore.success('已切换为英文版本')
        return
      }
    }

    const provider = settingsStore.getCurrentProvider()
    const model = settingsStore.getCurrentModel()

    if (!provider || !model) {
      notificationStore.error('请先配置AI模型')
      return
    }

    try {
      isConvertingLanguage.value = true
      const targetLanguage = targetLangCode === 'zh' ? '中文' : '英文'

      // 清理内容中可能的 AI 思考标签
      const cleanedContent = cleanAIResponseForFormatting(currentGeneratedPrompt.value)

      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `你是一个专业的AI提示词翻译助手。你的任务是将提示词翻译为${targetLanguage}，同时保持提示词的专业性、准确性和完整性。

**重要规则**：
1. **必须保留所有原有的格式标记**（如 Markdown 的 #、- 或 XML 的标签）
2. **翻译必须准确传达原意**，特别是技术术语和指令
3. **保持提示词的专业语气和结构**
4. **不要添加任何额外的解释或说明**
5. **直接输出翻译结果，不要包含任何前言或后记**
6. **对于专有名词、技术术语，要使用行业标准译法**`
        },
        {
          role: 'user',
          content: `请将以下AI提示词翻译为${targetLanguage}：

${cleanedContent}`
        }
      ]

      const response = await aiService.callAI(
        messages,
        provider,
        model.id,
        false
      )

      if (response && response.trim()) {
        const cleaned = cleanConvertedResponse(response)
        
        // 升级到二维对象或保存翻译结果
        if (typeof prompt === 'string') {
          // 从字符串升级到二维对象
          const currentLang = languageState.value
          promptStore.promptData.generatedPrompt = {
            markdown: {
              zh: formatState.value === 'markdown' && currentLang === 'zh' ? prompt : (formatState.value === 'markdown' && targetLangCode === 'zh' ? cleaned : ''),
              en: formatState.value === 'markdown' && currentLang === 'en' ? prompt : (formatState.value === 'markdown' && targetLangCode === 'en' ? cleaned : '')
            },
            xml: {
              zh: formatState.value === 'xml' && currentLang === 'zh' ? prompt : (formatState.value === 'xml' && targetLangCode === 'zh' ? cleaned : ''),
              en: formatState.value === 'xml' && currentLang === 'en' ? prompt : (formatState.value === 'xml' && targetLangCode === 'en' ? cleaned : '')
            }
          }
        } else if (!('markdown' in prompt)) {
          // 从一维对象升级到二维对象
          promptStore.promptData.generatedPrompt = {
            markdown: {
              zh: formatState.value === 'markdown' ? (prompt.zh || (targetLangCode === 'zh' ? cleaned : '')) : '',
              en: formatState.value === 'markdown' ? (prompt.en || (targetLangCode === 'en' ? cleaned : '')) : ''
            },
            xml: {
              zh: formatState.value === 'xml' ? (prompt.zh || (targetLangCode === 'zh' ? cleaned : '')) : '',
              en: formatState.value === 'xml' ? (prompt.en || (targetLangCode === 'en' ? cleaned : '')) : ''
            }
          }
        } else {
          // 已经是二维对象，直接保存翻译结果
          prompt[formatState.value][targetLangCode] = cleaned
        }
        
        languageState.value = targetLangCode
        notificationStore.success(`已翻译为${targetLanguage}版本`)
      } else {
        notificationStore.error('语言转换失败：返回内容为空')
      }
    } catch (error) {
      notificationStore.error('语言转换失败，请重试')
    } finally {
      isConvertingLanguage.value = false
    }
  }

  return {
    isConvertingFormat,
    isConvertingLanguage,
    formatState,
    languageState,
    currentGeneratedPrompt,
    toggleFormat,
    toggleLanguage
  }
}
