<template>
  <div class="h-full flex flex-col">
    <!-- 头部 -->
    <div class="p-4 border-b border-gray-200">
      <h2 class="text-lg font-semibold text-gray-800 mb-1">效果测试</h2>
      <p class="text-sm text-gray-600">测试优化前���的提示词效果对比</p>
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <!-- 模型配置 -->
      <div class="space-y-3">
        <h3 class="text-sm font-medium text-gray-700">测试配置</h3>
        
        <!-- 模型选择 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-sm text-gray-600">测试模型</label>
            <button
              @click="addTestModel"
              class="text-xs text-blue-600 hover:text-blue-700"
            >
              + 添加模型
            </button>
          </div>
          
          <div class="space-y-2">
            <div
              v-for="(config, index) in testModelConfigs"
              :key="index"
              class="p-3 border border-gray-200 rounded-lg"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-2">
                  <span class="text-sm font-medium">模型 {{ index + 1 }}</span>
                  <button
                    @click="removeTestModel(index)"
                    class="text-red-500 hover:text-red-700"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div class="flex items-center space-x-1">
                  <button
                    @click="testConnection(config)"
                    :disabled="isTestingConnection"
                    class="text-xs text-gray-600 hover:text-gray-700"
                  >
                    {{ isTestingConnection ? '测试中...' : '测试连接' }}
                  </button>
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label class="block text-gray-600 mb-1">提供商</label>
                  <select
                    v-model="config.providerId"
                    class="w-full p-1 border border-gray-300 rounded text-xs"
                  >
                    <option value="">选择提供商</option>
                    <option v-for="provider in availableProviders" :key="provider.id" :value="provider.id">
                      {{ provider.name }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-gray-600 mb-1">模型</label>
                  <select
                    v-model="config.modelId"
                    class="w-full p-1 border border-gray-300 rounded text-xs"
                  >
                    <option value="">选择模型</option>
                    <option v-for="model in getProviderModels(config.providerId)" :key="model.id" :value="model.id">
                      {{ model.name }}
                    </option>
                  </select>
                </div>
              </div>
              
              <div class="grid grid-cols-3 gap-2 text-xs mt-2">
                <div>
                  <label class="block text-gray-600 mb-1">Temperature</label>
                  <input
                    v-model.number="config.parameters.temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    class="w-full p-1 border border-gray-300 rounded"
                  >
                </div>
                <div>
                  <label class="block text-gray-600 mb-1">Max Tokens</label>
                  <input
                    v-model.number="config.parameters.maxTokens"
                    type="number"
                    min="1"
                    class="w-full p-1 border border-gray-300 rounded"
                  >
                </div>
                <div>
                  <label class="block text-gray-600 mb-1">Top P</label>
                  <input
                    v-model.number="config.parameters.topP"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    class="w-full p-1 border border-gray-300 rounded"
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 提示词版本选择 -->
        <div class="space-y-2">
          <label class="text-sm text-gray-600">提示词版本</label>
          <div class="flex items-center space-x-2">
            <label class="flex items-center">
              <input
                type="radio"
                v-model="promptVersion"
                value="original"
                class="mr-1"
              >
              <span class="text-sm">原始版本</span>
            </label>
            <label class="flex items-center">
              <input
                type="radio"
                v-model="promptVersion"
                value="optimized"
                :disabled="!hasOptimizedPrompt"
                class="mr-1"
              >
              <span class="text-sm">优化版本</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 测试用例 -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-medium text-gray-700">测试用例</h3>
          <button
            @click="showTestCaseModal = true"
            class="text-xs text-blue-600 hover:text-blue-700"
          >
            管理测试用例
          </button>
        </div>

        <div class="space-y-2">
          <div v-if="testCases.length === 0" class="text-center py-4">
            <p class="text-sm text-gray-500 mb-2">暂无测试用例</p>
            <button
              @click="addTestCase"
              class="text-xs text-blue-600 hover:text-blue-700"
            >
              添加测试用例
            </button>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="(testCase, index) in testCases"
              :key="index"
              class="flex items-center justify-between p-2 bg-gray-50 rounded border"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-800 truncate">{{ testCase }}</p>
              </div>
              <div class="flex items-center space-x-1">
                <button
                  @click="editTestCase(index)"
                  class="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  @click="removeTestCase(index)"
                  class="text-red-400 hover:text-red-600 p-1"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 快速添加测试用例 -->
        <div class="flex space-x-2">
          <input
            v-model="newTestCase"
            @keyup.enter="addTestCase"
            placeholder="输入测试用例，按回车添加"
            class="flex-1 p-2 border border-gray-300 rounded text-sm"
          >
          <button
            @click="addTestCase"
            :disabled="!newTestCase.trim()"
            class="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            添加
          </button>
        </div>
      </div>

      <!-- 执行测试 -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-medium text-gray-700">执行测试</h3>
          <div class="text-xs text-gray-500">
            {{ testCases.length }} 个测试用例
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <button
            @click="runSingleTest"
            :disabled="!canTest || isTesting"
            class="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <span v-if="isTesting" class="flex items-center justify-center gap-1">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              测试中...
            </span>
            <span v-else>开始测试</span>
          </button>
          <button
            @click="runBatchTest"
            :disabled="!canBatchTest || isBatchTesting"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <span v-if="isBatchTesting" class="flex items-center gap-1">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              批量测试
            </span>
            <span v-else>批量测试</span>
          </button>
        </div>
      </div>

      <!-- 测试结果 -->
      <div v-if="testResults.length > 0" class="space-y-3">
        <h3 class="text-sm font-medium text-gray-700">测试结果</h3>
        
        <div class="space-y-3">
          <div
            v-for="(result, index) in testResults"
            :key="index"
            class="border border-gray-200 rounded-lg p-3"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-2">
                <span class="text-sm font-medium">{{ result.modelConfig.modelId }}</span>
                <span
                  :class="getStatusClass(result.status)"
                  class="px-2 py-0.5 text-xs rounded-full"
                >
                  {{ getStatusLabel(result.status) }}
                </span>
              </div>
              <div v-if="result.data" class="text-xs text-gray-500">
                {{ result.data.responseTime }}ms | {{ result.data.tokenCount }} tokens
              </div>
            </div>

            <div v-if="result.data" class="space-y-2">
              <div class="p-2 bg-gray-50 rounded border max-h-32 overflow-y-auto">
                <p class="text-sm text-gray-800 whitespace-pre-wrap">{{ result.data.response }}</p>
              </div>
              
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <div class="flex items-center space-x-1">
                    <span class="text-xs text-gray-600">评分:</span>
                    <div class="flex">
                      <button
                        v-for="star in 5"
                        :key="star"
                        @click="rateResult(index, star)"
                        class="text-gray-300 hover:text-yellow-400"
                        :class="star <= (result.data?.rating || 0) ? 'text-yellow-400' : ''"
                      >
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <button
                    @click="copyResult(result)"
                    class="text-xs text-gray-600 hover:text-gray-700"
                  >
                    复制
                  </button>
                  <button
                    @click="removeResult(index)"
                    class="text-xs text-red-600 hover:text-red-700"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>

            <div v-else-if="result.error" class="text-sm text-red-600">
              错误: {{ result.error.message }}
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex items-center justify-between pt-3 border-t">
          <div class="text-xs text-gray-600">
            {{ testResults.length }} 个测试结果
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="clearResults"
              class="text-xs text-gray-600 hover:text-gray-700"
            >
              清空结果
            </button>
            <button
              @click="exportResults"
              class="text-xs text-blue-600 hover:text-blue-700"
            >
              导出结果
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 测试用例管理模态框 -->
    <div v-if="showTestCaseModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
        <h3 class="text-lg font-semibold mb-4">测试用例管理</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">预设测试用例</label>
            <div class="grid grid-cols-1 gap-2">
              <button
                v-for="preset in presetTestCases"
                :key="preset.name"
                @click="addPresetTestCase(preset.content)"
                class="text-left p-3 border border-gray-200 rounded hover:bg-gray-50"
              >
                <div class="font-medium text-sm">{{ preset.name }}</div>
                <div class="text-xs text-gray-600">{{ preset.description }}</div>
              </button>
            </div>
          </div>
        </div>

        <div class="mt-4 flex justify-end">
          <button
            @click="showTestCaseModal = false"
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { useOptimizeStore } from '@/stores/optimizeStore'
import { useOptimizeModule } from '../composables/useOptimizeModule'
import { copyToClipboard as copyUtil } from '@/utils/clipboardUtils'

const settingsStore = useSettingsStore()
const optimizeStore = useOptimizeStore()
const { runModelTest } = useOptimizeModule()

const {
  systemPrompt,
  userPrompt,
  optimizedPrompts,
  testCases,
  testResults,
  hasOptimizedPrompt,
  isTesting,
  addTestCase: storeAddTestCase,
  removeTestCase: storeRemoveTestCase,
  setTestResults
} = optimizeStore

const { providers } = settingsStore

// 本地状态
const promptVersion = ref<'original' | 'optimized'>('original')
const testModelConfigs = ref([
  {
    providerId: '',
    modelId: '',
    promptVersion: 'original',
    parameters: {
      temperature: 0.7,
      maxTokens: 1000,
      topP: 1
    }
  }
])
const newTestCase = ref('')
const isBatchTesting = ref(false)
const isTestingConnection = ref(false)
const showTestCaseModal = ref(false)

// 预设测试用例
const presetTestCases = [
  {
    name: '文本分析',
    description: '分析给定文本的主要观点',
    content: '请分析以下文章的主要观点和核心论点：'
  },
  {
    name: '代码生成',
    description: '生成特定功能的代码',
    content: '请用Python写一个函数来计算斐波那契数列：'
  },
  {
    name: '翻译任务',
    description: '将文本翻译成其他语言',
    content: '请将以下中文翻译成英文：'
  },
  {
    name: '创意写作',
    description: '创作短篇故事或诗歌',
    content: '请写一首关于春天的诗：'
  },
  {
    name: '数据分析',
    description: '分析数据并提供洞察',
    content: '请分析以下销售数据并给出业务建议：'
  }
]

// 计算属性
const availableProviders = computed(() => providers.value || [])
const canTest = computed(() => 
  testModelConfigs.value.some(config => 
    config.providerId && 
    config.modelId && 
    testCases.value.length > 0
  )
)
const canBatchTest = computed(() => 
  canTest.value && 
  testCases.value.length > 1
)

// 事件处理
const addTestModel = () => {
  testModelConfigs.value.push({
    providerId: '',
    modelId: '',
    promptVersion: promptVersion.value,
    parameters: {
      temperature: 0.7,
      maxTokens: 1000,
      topP: 1
    }
  })
}

const removeTestModel = (index: number) => {
  if (testModelConfigs.value.length > 1) {
    testModelConfigs.value.splice(index, 1)
  }
}

const getProviderModels = (providerId: string) => {
  const provider = availableProviders.value.find(p => p.id === providerId)
  return provider?.models || []
}

const testConnection = async (config: any) => {
  // 实现连接测试逻辑
  isTestingConnection.value = true
  try {
    console.log('Testing connection for:', config)
    // 这里调用实际的连接测试API
  } catch (error) {
    console.error('Connection test failed:', error)
  } finally {
    isTestingConnection.value = false
  }
}

const addTestCase = () => {
  if (newTestCase.value.trim()) {
    storeAddTestCase(newTestCase.value.trim())
    newTestCase.value = ''
  }
}

const editTestCase = (index: number) => {
  const newContent = prompt('编辑测试用例:', testCases.value[index])
  if (newContent && newContent.trim()) {
    testCases.value[index] = newContent.trim()
  }
}

const removeTestCase = (index: number) => {
  storeRemoveTestCase(index)
}

const addPresetTestCase = (content: string) => {
  storeAddTestCase(content)
}

const runSingleTest = async () => {
  isTesting.value = true
  try {
    const results = []
    for (const config of testModelConfigs.value) {
      if (config.providerId && config.modelId) {
        const result = await runModelTest(config, testCases.value[0])
        results.push(result)
      }
    }
    setTestResults(results)
  } catch (error) {
    console.error('Test failed:', error)
  } finally {
    isTesting.value = false
  }
}

const runBatchTest = async () => {
  isBatchTesting.value = true
  try {
    const results = []
    for (const testCase of testCases.value) {
      for (const config of testModelConfigs.value) {
        if (config.providerId && config.modelId) {
          const result = await runModelTest(config, testCase)
          results.push(result)
        }
      }
    }
    setTestResults(results)
  } catch (error) {
    console.error('Batch test failed:', error)
  } finally {
    isBatchTesting.value = false
  }
}

const rateResult = (index: number, rating: number) => {
  if (testResults.value[index].data) {
    testResults.value[index].data!.rating = rating
  }
}

const copyResult = (result: any) => {
  if (result.data) {
    copyUtil(result.data.response).then(() => {
      console.log('Result copied to clipboard')
    })
  }
}

const removeResult = (index: number) => {
  testResults.value.splice(index, 1)
}

const clearResults = () => {
  testResults.value = []
}

const exportResults = () => {
  // 实现导出结果的逻辑
  const exportData = testResults.value.map(result => ({
    model: result.modelConfig.modelId,
    status: result.status,
    response: result.data?.response,
    responseTime: result.data?.responseTime,
    tokenCount: result.data?.tokenCount,
    rating: result.data?.rating
  }))
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `test-results-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 工具函数
const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    success: 'bg-green-100 text-green-600',
    error: 'bg-red-100 text-red-600',
    pending: 'bg-yellow-100 text-yellow-600'
  }
  return classes[status] || 'bg-gray-100 text-gray-600'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    success: '成功',
    error: '失败',
    pending: '进行中'
  }
  return labels[status] || status
}
</script>