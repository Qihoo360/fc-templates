<template>
  <div class="bg-white rounded-lg shadow-sm p-6">
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-gray-800 mb-2">系统提示词生成器</h2>
      <p class="text-sm text-gray-600">按照GPrompt方式生成高质量AI系统提示词</p>
    </div>

    <!-- 用户输入区域 -->
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          AI角色描述
        </label>
        <textarea
          v-model="description"
          placeholder="请描述您希望AI扮演的角色和主要任务..."
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows="4"
        ></textarea>
      </div>

      <!-- 语言选择 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          输出语言
        </label>
        <select 
          v-model="language" 
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="zh">中文</option>
          <option value="en">英文</option>
        </select>
      </div>

      <!-- 操作按钮 -->
      <div class="flex space-x-3">
        <button
          @click="handleGetPoints"
          :disabled="isBusy || !description.trim()"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span v-if="loadingStep === 1" class="flex items-center">
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            获取关键指令...
          </span>
          <span v-else>获取关键指令</span>
        </button>

        <button
          @click="handleAutomate"
          :disabled="isBusy || !description.trim()"
          class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span v-if="loadingStep === 0" class="flex items-center">
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            自动生成中...
          </span>
          <span v-else>自动生成提示词</span>
        </button>

        <button
          @click="useConversationResult"
          :disabled="isBusy || !conversationReport"
          class="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          使用对话结果
        </button>
      </div>

      <!-- 对话结果提示 -->
      <div v-if="conversationReport" class="bg-purple-50 border-l-4 border-purple-400 p-4">
        <p class="text-purple-700">📋 检测到对话式需求收集结果，点击"使用对话结果"可直接基于需求报告生成提示词。</p>
      </div>

      <!-- 自动化进度显示 -->
      <div v-if="automationStatus" class="bg-blue-50 border-l-4 border-blue-400 p-4">
        <p class="text-blue-700">{{ automationStatus }}</p>
      </div>

      <!-- 错误信息 -->
      <div v-if="error" class="bg-red-50 border-l-4 border-red-400 p-4">
        <p class="text-red-700">{{ error }}</p>
      </div>
    </div>

    <!-- 步骤1: 关键指令 -->
    <div v-if="completedSteps.includes(1)" class="mt-6">
      <div class="border rounded-lg">
        <div 
          @click="openStep = openStep === 1 ? 0 : 1"
          class="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 rounded-t-lg"
        >
          <div class="flex items-center">
            <div class="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm mr-3">
              ✓
            </div>
            <h3 class="font-medium text-gray-800">步骤1: 关键指令</h3>
          </div>
          <div class="text-gray-500">
            {{ openStep === 1 ? '−' : '+' }}
          </div>
        </div>
        
        <div v-if="openStep === 1" class="p-4 border-t">
          <div v-if="completedSteps.includes(1)" class="space-y-2">
            <div 
              v-for="(_, index) in Math.max((thinkingPoints || []).length, 1)" 
              :key="index"
              class="flex items-start"
            >
              <span class="text-gray-500 mr-2">•</span>
              <input
                v-model="(thinkingPoints || [])[index]"
                @input="if (!thinkingPoints) thinkingPoints = []; thinkingPoints[index] = ($event.target as HTMLInputElement)?.value || ''"
                class="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div class="mt-4 flex justify-between">
              <button
                @click="addThinkingPoint"
                class="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm"
              >
                + 添加指令
              </button>
              
              <button
                @click="handleGenerateInitial"
                :disabled="loadingStep === 2"
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="loadingStep === 2" class="flex items-center">
                  <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  生成初始提示词...
                </span>
                <span v-else>生成初始提示词</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 步骤2: 初始提示词 -->
    <div v-if="completedSteps.includes(2)" class="mt-4">
      <div class="border rounded-lg">
        <div 
          @click="openStep = openStep === 2 ? 0 : 2"
          class="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 rounded-t-lg"
        >
          <div class="flex items-center">
            <div class="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm mr-3">
              ✓
            </div>
            <h3 class="font-medium text-gray-800">步骤2: 初始提示词</h3>
          </div>
          <div class="text-gray-500">
            {{ openStep === 2 ? '−' : '+' }}
          </div>
        </div>
        
        <div v-if="openStep === 2" class="p-4 border-t">
          <div v-if="completedSteps.includes(2)" class="space-y-4">
            <textarea
              v-model="initialPrompt"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="8"
            ></textarea>
            
            <div class="flex justify-between">
              <button
                @click="copyToClipboard(initialPrompt || '')"
                :disabled="!initialPrompt || initialPrompt.trim() === ''"
                class="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ copiedInitial ? '已复制!' : '复制' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 步骤3: 优化建议 -->
    <div v-if="completedSteps.includes(3)" class="mt-4">
      <div class="border rounded-lg">
        <div 
          @click="openStep = openStep === 3 ? 0 : 3"
          class="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 rounded-t-lg"
        >
          <div class="flex items-center">
            <div class="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm mr-3">
              ✓
            </div>
            <h3 class="font-medium text-gray-800">步骤3: 优化建议</h3>
          </div>
          <div class="text-gray-500">
            {{ openStep === 3 ? '−' : '+' }}
          </div>
        </div>
        
        <div v-if="openStep === 3" class="p-4 border-t">
          <div v-if="completedSteps.includes(3)" class="space-y-2">
            <div 
              v-for="(_, index) in Math.max((advice || []).length, 1)" 
              :key="index"
              class="flex items-start"
            >
              <span class="text-gray-500 mr-2">•</span>
              <input
                v-model="(advice || [])[index]"
                @input="if (!advice) advice = []; advice[index] = ($event.target as HTMLInputElement)?.value || ''"
                class="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div class="mt-4 flex justify-between">
              <button
                @click="copyToClipboard((advice || []).join('\\n'))"
                :disabled="!advice || advice.length === 0 || advice.every(a => !a || a.trim() === '')"
                class="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ copiedAdvice ? '已复制!' : '复制建议' }}
              </button>
              
              <button
                @click="handleApplyAdvice"
                :disabled="loadingStep === 4"
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="loadingStep === 4" class="flex items-center">
                  <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  应用建议...
                </span>
                <span v-else>应用建议</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 步骤4: 最终提示词 -->
    <div v-if="completedSteps.includes(4)" class="mt-4">
      <div class="border rounded-lg">
        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-t-lg">
          <div 
            @click="openStep = openStep === 4 ? 0 : 4"
            class="flex items-center cursor-pointer hover:bg-gray-100 -m-4 p-4 flex-1"
          >
            <div class="flex items-center">
              <div class="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm mr-3">
                ✓
              </div>
              <h3 class="font-medium text-gray-800">步骤4: 最终提示词</h3>
            </div>
            <div class="text-gray-500 ml-2">
              {{ openStep === 4 ? '−' : '+' }}
            </div>
          </div>
          
        </div>
        
        <div v-if="openStep === 4" class="p-4 border-t">
          <div v-if="completedSteps.includes(4)" class="space-y-4">
            <textarea
              v-model="finalPrompt"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="12"
            ></textarea>
            
            <div class="flex justify-between">
              <button
                @click="copyToClipboard(finalPrompt || '')"
                :disabled="!finalPrompt || finalPrompt.trim() === ''"
                class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {{ copiedFinal ? '已复制!' : '复制最终提示词' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { usePromptStore } from '@/stores/promptStore'
import { PromptGeneratorService } from '@/services/promptGeneratorService'

const settingsStore = useSettingsStore()
const promptStore = usePromptStore()
const promptGeneratorService = PromptGeneratorService.getInstance()

// API配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// 数据状态
const description = ref('')
const language = ref('zh')
const thinkingPoints = ref<string[] | null>(null)
const initialPrompt = ref<string | null>(null)
const advice = ref<string[] | null>(null)
const finalPrompt = ref<string | null>(null)

// UI状态
const loadingStep = ref<number | null>(null)
const automationStatus = ref<string | null>(null)
const error = ref<string | null>(null)
const completedSteps = ref<number[]>([])
const openStep = ref<number>(1)
const isSaving = ref(false)

// 复制状态
const copiedInitial = ref(false)
const copiedAdvice = ref(false)
const copiedFinal = ref(false)

// 计算属性
const isBusy = computed(() => loadingStep.value !== null)
const conversationReport = computed(() => promptStore.promptData.requirementReport)

// 重置状态
const resetState = () => {
  thinkingPoints.value = null
  initialPrompt.value = null
  advice.value = null
  finalPrompt.value = null
  completedSteps.value = []
  error.value = null
  automationStatus.value = null
}


// 获取关键指令
const handleGetPoints = async () => {
  if (!description.value.trim()) return
  
  try {
    loadingStep.value = 1
    resetState()
    openStep.value = 1
    
    const provider = settingsStore.getCurrentProvider()
    const model = settingsStore.getCurrentModel()
    
    if (!provider || !model) {
      throw new Error('请先配置AI模型和API密钥')
    }
    
    const points = await promptGeneratorService.getSystemPromptThinkingPoints(
      description.value,
      model.id,
      language.value,
      [],
      provider
    )
    
    thinkingPoints.value = points
    completedSteps.value = [1]
    openStep.value = 1
    
  } catch (err: any) {
    error.value = err.message || '获取关键指令失败'
  } finally {
    loadingStep.value = null
  }
}

// 自动生成
const handleAutomate = async () => {
  if (!description.value.trim()) return
  
  try {
    loadingStep.value = 0
    resetState()
    openStep.value = 1
    
    const provider = settingsStore.getCurrentProvider()
    const model = settingsStore.getCurrentModel()
    
    if (!provider || !model) {
      throw new Error('请先配置AI模型和API密钥')
    }
    
    // 步骤1: 生成关键指令
    automationStatus.value = '步骤 1/4: 生成关键指令...'
    const points = await promptGeneratorService.getSystemPromptThinkingPoints(
      description.value,
      model.id,
      language.value,
      [],
      provider
    )
    thinkingPoints.value = points
    completedSteps.value = [1]
    
    // 步骤2: 生成初始提示词
    automationStatus.value = '步骤 2/4: 生成初始提示词...'
    const initial = await promptGeneratorService.generateSystemPrompt(
      description.value,
      model.id,
      language.value,
      [],
      points,
      provider
    )
    initialPrompt.value = initial
    completedSteps.value = [1, 2]
    
    // 步骤3: 获取优化建议
    automationStatus.value = '步骤 3/4: 获取优化建议...'
    const adviceResult = await promptGeneratorService.getOptimizationAdvice(
      initial,
      'system',
      model.id,
      language.value,
      [],
      provider
    )
    advice.value = adviceResult
    completedSteps.value = [1, 2, 3]
    
    // 步骤4: 生成最终提示词
    automationStatus.value = '步骤 4/4: 生成最终提示词...'
    const final = await promptGeneratorService.applyOptimizationAdvice(
      initial,
      adviceResult,
      'system',
      model.id,
      language.value,
      [],
      provider
    )
    finalPrompt.value = final
    completedSteps.value = [1, 2, 3, 4]
    openStep.value = 4
    
    automationStatus.value = null
    
  } catch (err: any) {
    error.value = err.message || '自动生成失败'
    automationStatus.value = null
  } finally {
    loadingStep.value = null
  }
}

// 生成初始提示词
const handleGenerateInitial = async () => {
  if (!thinkingPoints.value) return
  
  try {
    loadingStep.value = 2
    
    const provider = settingsStore.getCurrentProvider()
    const model = settingsStore.getCurrentModel()
    
    
    if (!provider || !model) {
      throw new Error('请先配置AI模型和API密钥')
    }
    
    const initial = await promptGeneratorService.generateSystemPrompt(
      description.value,
      model.id,
      language.value,
      [],
      thinkingPoints.value,
      provider
    )
    
    initialPrompt.value = initial
    completedSteps.value = [...completedSteps.value, 2]
    
    // 自动获取优化建议
    const adviceResult = await promptGeneratorService.getOptimizationAdvice(
      initial,
      'system',
      model.id,
      language.value,
      [],
      provider
    )
    advice.value = adviceResult
    completedSteps.value = [...completedSteps.value, 3]
    
    // 自动生成最终提示词
    const final = await promptGeneratorService.applyOptimizationAdvice(
      initial,
      adviceResult,
      'system',
      model.id,
      language.value,
      [],
      provider
    )
    finalPrompt.value = final
    completedSteps.value = [...completedSteps.value, 4]
    
  } catch (err: any) {
    error.value = err.message || '生成初始提示词失败'
  } finally {
    loadingStep.value = null
  }
}

// 应用建议
const handleApplyAdvice = async () => {
  if (!initialPrompt.value || !advice.value) return
  
  try {
    loadingStep.value = 4
    
    const provider = settingsStore.getCurrentProvider()
    const model = settingsStore.getCurrentModel()
    
    if (!provider || !model) {
      throw new Error('请先配置AI模型和API密钥')
    }
    
    const final = await promptGeneratorService.applyOptimizationAdvice(
      initialPrompt.value,
      advice.value,
      'system',
      model.id,
      language.value,
      [],
      provider
    )
    
    finalPrompt.value = final
    if (!completedSteps.value.includes(4)) {
      completedSteps.value = [...completedSteps.value, 4]
    }
    openStep.value = 4
    
  } catch (err: any) {
    error.value = err.message || '应用建议失败'
  } finally {
    loadingStep.value = null
  }
}

// 添加关键指令
const addThinkingPoint = () => {
  if (!thinkingPoints.value) {
    thinkingPoints.value = []
  }
  thinkingPoints.value.push('')
}

// 使用对话结果
const useConversationResult = () => {
  if (conversationReport.value) {
    description.value = conversationReport.value
  }
}

// 保存提示词到数据库
const savePrompt = async () => {
  if (!finalPrompt.value || !finalPrompt.value.trim()) {
    error.value = '请先生成最终提示词'
    return
  }

  try {
    isSaving.value = true
    error.value = null

    // 获取JWT token
    const token = localStorage.getItem('yprompt_token')
    if (!token) {
      throw new Error('请先登录')
    }

    // 准备保存数据
    const saveData = {
      title: `提示词_${description.value.slice(0, 20)}${description.value.length > 20 ? '...' : ''}`,
      description: description.value,
      requirement_report: description.value,
      thinking_points: thinkingPoints.value || [],
      initial_prompt: initialPrompt.value || '',
      advice: advice.value || [],
      final_prompt: finalPrompt.value,
      language: language.value,
      format: 'markdown',
      tags: []
    }

    // 调用后端API
    const response = await fetch(`${API_BASE_URL}/api/prompts/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(saveData)
    })

    const result = await response.json()

    if (response.ok && result.code === 200) {
      // 保存成功，显示成功消息
      alert('提示词保存成功！')
      console.log('保存成功，提示词ID:', result.data.id)
    } else {
      throw new Error(result.message || '保存失败')
    }

  } catch (err: any) {
    error.value = err.message || '保存失败'
    console.error('保存提示词失败:', err)
  } finally {
    isSaving.value = false
  }
}
</script>