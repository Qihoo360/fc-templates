import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 类型定义
export interface Suggestion {
  id: string
  type: 'add' | 'modify' | 'remove'
  category: 'role' | 'profile' | 'skills' | 'goal' | 'rules' | 'workflow' | 'format' | 'example' | 'initialization' | 'task' | 'context' | 'constraints' | 'language'
  title: string
  description: string
  reason: string
  expectedEffect: string
  priority: 'high' | 'medium' | 'low'
  content?: string
  applied?: boolean
}

export interface PromptAnalysis {
  overall_score: number
  analysis: {
    role: { score: number; status: string; feedback: string }
    task: { score: number; status: string; feedback: string }
    format: { score: number; status: string; feedback: string }
    constraints: { score: number; status: string; feedback: string }
    example: { score: number; status: string; feedback: string }
    language: { score: number; status: string; feedback: string }
  }
  suggestions: Array<{ area: string; suggestion: string }>
  language: 'zh' | 'en'
  word_count: number
  estimated_tokens: number
}

export interface Version {
  id: string
  version: string
  systemPrompt: string
  userPrompt: string
  changes: Change[]
  appliedSuggestions: string[]
  createdAt: Date
  note?: string
  tag?: 'initial' | 'draft' | 'beta' | 'stable' | 'production' | 'archived' | 'rollback'
}

export interface Change {
  type: 'add' | 'modify' | 'remove'
  field: 'system' | 'user'
  content: string
  position?: { start: number; end: number }
}

export interface TestResult {
  id: string
  testCase: string
  response: string
  responseTime: number
  tokenCount: number
  modelId: string
  modelName: string
  status: 'success' | 'failed'
  rating: number
}

export interface ModelTestConfig {
  provider: string
  modelId: string
  temperature: number
  maxTokens: number
  promptVersion: 'original' | 'optimized'
}

export interface SingleTestResult {
  response: string
  responseTime: number
  tokenCount: number
  model: string
}

export interface ModelTestConfig {
  provider: string
  modelId: string
  temperature: number
  maxTokens: number
  promptVersion: 'original' | 'optimized'
}

export const useOptimizeStore = defineStore('optimize', () => {
  // 输入状态
  const systemPrompt = ref('')
  const userPrompt = ref('')
  const importedPromptId = ref<string | null>(null)
  const loadedPromptId = ref<number | null>(null)  // 从库中加载的提示词ID

  // 分析状态
  const analysis = ref<PromptAnalysis | null>(null)
  const isAnalyzing = ref(false)

  // 优化状态
  const suggestions = ref<Suggestion[]>([])
  const selectedSuggestions = ref<string[]>([])
  const optimizedPrompts = ref({
    system: '',
    user: ''
  })
  const isGeneratingSuggestions = ref(false)
  const isApplyingSuggestions = ref(false)

  // 版本管理
  const versions = ref<Version[]>([])
  const currentVersion = ref<string>('original')
  const isVersionLoading = ref(false)

  // 测试状态
  const testCases = ref<string[]>([])
  const currentTestCase = ref('')
  const testResults = ref<TestResult[]>([])
  const isTesting = ref(false)

  // UI 状态
  const activeTab = ref<'input' | 'optimize' | 'test'>('input')
  const showDiffView = ref(false)
  const showVersionHistory = ref(false)

  // 计算属性
  const hasPromptContent = computed(() => 
    systemPrompt.value.trim() || userPrompt.value.trim()
  )

  const hasOptimizedPrompt = computed(() => 
    optimizedPrompts.value.system.trim() || optimizedPrompts.value.user.trim()
  )

  const selectedSuggestionObjects = computed(() => 
    suggestions.value.filter(s => selectedSuggestions.value.includes(s.id))
  )

  const currentVersionData = computed(() => 
    versions.value.find(v => v.version === currentVersion.value)
  )

  // Actions
  const resetOptimization = () => {
    systemPrompt.value = ''
    userPrompt.value = ''
    importedPromptId.value = null
    loadedPromptId.value = null
    analysis.value = null
    suggestions.value = []
    selectedSuggestions.value = []
    optimizedPrompts.value = { system: '', user: '' }
    versions.value = []
    currentVersion.value = 'original'
    testCases.value = []
    testResults.value = []
    activeTab.value = 'input'
  }

  const setPrompts = (system: string, user: string, promptId?: string) => {
    systemPrompt.value = system
    userPrompt.value = user
    if (promptId) {
      importedPromptId.value = promptId
    }
  }

  const setLoadedPromptId = (promptId: number | null) => {
    loadedPromptId.value = promptId
  }

  const setAnalysis = (analysisData: PromptAnalysis) => {
    analysis.value = analysisData
  }

  const setSuggestions = (suggestionsData: Suggestion[]) => {
    suggestions.value = suggestionsData
    // 默认选中所有建议
    selectedSuggestions.value = suggestionsData.map(s => s.id)
  }

  const toggleSuggestion = (suggestionId: string) => {
    const index = selectedSuggestions.value.indexOf(suggestionId)
    if (index > -1) {
      selectedSuggestions.value.splice(index, 1)
    } else {
      selectedSuggestions.value.push(suggestionId)
    }
  }

  const selectAllSuggestions = () => {
    selectedSuggestions.value = suggestions.value.map(s => s.id)
  }

  const deselectAllSuggestions = () => {
    selectedSuggestions.value = []
  }

  const setOptimizedPrompts = (system: string, user: string) => {
    optimizedPrompts.value = { system, user }
    // 自动创建一个新版本
    const newVersion: Version = {
      id: `v_${Date.now()}`,
      version: `V${versions.value.length + 1}`,
      systemPrompt: system,
      userPrompt: user,
      changes: generateChanges(systemPrompt.value, system, userPrompt.value, user),
      appliedSuggestions: [...selectedSuggestions.value],
      createdAt: new Date(),
      tag: 'draft'
    }
    versions.value.push(newVersion)
    currentVersion.value = newVersion.version
  }

  const generateChanges = (oldSystem: string, newSystem: string, oldUser: string, newUser: string): Change[] => {
    const changes: Change[] = []
    
    // 简单的变化检测（实际应用中可以使用更复杂的diff算法）
    if (oldSystem !== newSystem) {
      changes.push({
        type: 'modify',
        field: 'system',
        content: newSystem
      })
    }
    
    if (oldUser !== newUser) {
      changes.push({
        type: 'modify', 
        field: 'user',
        content: newUser
      })
    }
    
    return changes
  }

  const addTestCase = (testCase: string) => {
    if (testCase.trim() && !testCases.value.includes(testCase.trim())) {
      testCases.value.push(testCase.trim())
    }
  }

  const setCurrentTestCase = (testCase: string) => {
    currentTestCase.value = testCase
  }

  const setTestResults = (results: TestResult[]) => {
    testResults.value = results
  }

  const switchTab = (tab: 'input' | 'optimize' | 'test') => {
    activeTab.value = tab
  }

  const toggleDiffView = () => {
    showDiffView.value = !showDiffView.value
  }

  const toggleVersionHistory = () => {
    showVersionHistory.value = !showVersionHistory.value
  }

  const switchVersion = (version: string) => {
    currentVersion.value = version
    const versionData = versions.value.find(v => v.version === version)
    if (versionData) {
      optimizedPrompts.value = {
        system: versionData.systemPrompt,
        user: versionData.userPrompt
      }
    }
  }

  return {
    // State
    systemPrompt,
    userPrompt,
    importedPromptId,
    loadedPromptId,
    analysis,
    isAnalyzing,
    suggestions,
    selectedSuggestions,
    optimizedPrompts,
    isGeneratingSuggestions,
    isApplyingSuggestions,
    versions,
    currentVersion,
    isVersionLoading,
    testCases,
    currentTestCase,
    testResults,
    isTesting,
    activeTab,
    showDiffView,
    showVersionHistory,

    // Computed
    hasPromptContent,
    hasOptimizedPrompt,
    selectedSuggestionObjects,
    currentVersionData,

    // Actions
    resetOptimization,
    setPrompts,
    setLoadedPromptId,
    setAnalysis,
    setSuggestions,
    toggleSuggestion,
    selectAllSuggestions,
    deselectAllSuggestions,
    setOptimizedPrompts,
    addTestCase,
    setCurrentTestCase,
    setTestResults,
    switchTab,
    toggleDiffView,
    toggleVersionHistory,
    switchVersion
  }
})