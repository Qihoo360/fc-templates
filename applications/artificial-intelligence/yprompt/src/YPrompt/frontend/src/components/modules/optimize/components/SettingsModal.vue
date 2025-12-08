<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-gray-800">优化设置</h3>
        <button
          @click="closeSettings"
          class="text-gray-400 hover:text-gray-600"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <div class="space-y-6">
        <!-- 变量管理 -->
        <div class="border-b border-gray-200 pb-6">
          <h4 class="text-base font-medium text-gray-800 mb-4">变量管理</h4>
          <VariableManager
            :variables="variables"
            :predefined-variables="predefinedVariables"
            @variable-update="handleVariableUpdate"
            @variable-add="handleVariableAdd"
            @variable-remove="handleVariableRemove"
          />
        </div>

        <!-- 基本设置 -->
        <div class="border-b border-gray-200 pb-6">
          <h4 class="text-base font-medium text-gray-800 mb-4">基本设置</h4>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">温度值</label>
              <div class="flex items-center space-x-3">
                <input
                  v-model.number="localSettings.temperature"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  class="flex-1"
                >
                <span class="text-sm text-gray-600 w-12">{{ localSettings.temperature }}</span>
              </div>
              <p class="text-xs text-gray-500 mt-1">控制输出的随机性，值越高越有创造性</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">最大 Token 数</label>
              <input
                v-model.number="localSettings.maxTokens"
                type="number"
                min="100"
                max="4000"
                class="w-full p-2 border border-gray-300 rounded text-sm"
              >
              <p class="text-xs text-gray-500 mt-1">生成内容的最大长度</p>
            </div>
          </div>
        </div>

        <!-- 优化重点 -->
        <div class="border-b border-gray-200 pb-6">
          <h4 class="text-base font-medium text-gray-800 mb-4">优化重点</h4>
          
          <div class="space-y-3">
            <label class="flex items-center space-x-3">
              <input
                v-model="localSettings.focusAreas"
                type="checkbox"
                value="clarity"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              >
              <span class="text-sm text-gray-700">清晰度 - 使提示词更明确易懂</span>
            </label>

            <label class="flex items-center space-x-3">
              <input
                v-model="localSettings.focusAreas"
                type="checkbox"
                value="completeness"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              >
              <span class="text-sm text-gray-700">完整性 - 补充缺失的关键信息</span>
            </label>

            <label class="flex items-center space-x-3">
              <input
                v-model="localSettings.focusAreas"
                type="checkbox"
                value="specificity"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              >
              <span class="text-sm text-gray-700">具体性 - 增加具体的指导和约束</span>
            </label>

            <label class="flex items-center space-x-3">
              <input
                v-model="localSettings.focusAreas"
                type="checkbox"
                value="structure"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              >
              <span class="text-sm text-gray-700">结构 - 优化逻辑结构和流程</span>
            </label>

            <label class="flex items-center space-x-3">
              <input
                v-model="localSettings.focusAreas"
                type="checkbox"
                value="examples"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              >
              <span class="text-sm text-gray-700">示例 - 添加或改进示例说明</span>
            </label>
          </div>
        </div>

        <!-- 语言设置 -->
        <div class="border-b border-gray-200 pb-6">
          <h4 class="text-base font-medium text-gray-800 mb-4">语言设置</h4>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">输出语言</label>
            <select
              v-model="localSettings.language"
              class="w-full p-2 border border-gray-300 rounded text-sm"
            >
              <option value="zh">中文</option>
              <option value="en">英文</option>
              <option value="bilingual">中英双语</option>
            </select>
            <p class="text-xs text-gray-500 mt-1">优化建议和输出内容的使用语言</p>
          </div>
        </div>

        <!-- 高级设置 -->
        <div class="pb-6">
          <h4 class="text-base font-medium text-gray-800 mb-4">高级设置</h4>
          
          <div class="space-y-4">
            <div>
              <label class="flex items-center space-x-3">
                <input
                  v-model="localSettings.autoApplySuggestions"
                  type="checkbox"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                >
                <span class="text-sm text-gray-700">自动应用高优先级建议</span>
              </label>
              <p class="text-xs text-gray-500 mt-1">优先级为 "high" 的建议将自动应用</p>
            </div>

            <div>
              <label class="flex items-center space-x-3">
                <input
                  v-model="localSettings.preserveStyle"
                  type="checkbox"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                >
                <span class="text-sm text-gray-700">保持原有风格</span>
              </label>
              <p class="text-xs text-gray-500 mt-1">尽量保持原始提示词的语言风格和语气</p>
            </div>

            <div>
              <label class="flex items-center space-x-3">
                <input
                  v-model="localSettings.enableQualityComparison"
                  type="checkbox"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                >
                <span class="text-sm text-gray-700">启用质量对比</span>
              </label>
              <p class="text-xs text-gray-500 mt-1">显示优化前后的质量评分对比</p>
            </div>
          </div>
        </div>

        <!-- 预设配置 -->
        <div>
          <h4 class="text-base font-medium text-gray-800 mb-4">预设配置</h4>
          
          <div class="grid grid-cols-3 gap-3">
            <button
              @click="applyPreset('conservative')"
              class="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
            >
              <div class="text-sm font-medium text-gray-800">保守</div>
              <div class="text-xs text-gray-600">最小改动</div>
            </button>

            <button
              @click="applyPreset('balanced')"
              class="p-3 border border-blue-200 rounded-lg hover:bg-blue-50 bg-blue-50 text-center"
            >
              <div class="text-sm font-medium text-blue-800">平衡</div>
              <div class="text-xs text-blue-600">推荐设置</div>
            </button>

            <button
              @click="applyPreset('aggressive')"
              class="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
            >
              <div class="text-sm font-medium text-gray-800">激进</div>
              <div class="text-xs text-gray-600">大幅优化</div>
            </button>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
        <button
          @click="resetSettings"
          class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          重置
        </button>
        <button
          @click="closeSettings"
          class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          取消
        </button>
        <button
          @click="saveSettings"
          class="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          保存设置
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, watch } from 'vue'
import VariableManager from './VariableManager.vue'

interface Props {
  show: boolean
  optimizationSettings: {
    temperature: number
    maxTokens: number
    focusArea: string
    language: string
    focusAreas?: string[]
    autoApplySuggestions?: boolean
    preserveStyle?: boolean
    enableQualityComparison?: boolean
  }
  variables?: Record<string, string>
  predefinedVariables?: Record<string, string>
}

interface Emits {
  'update:show': [value: boolean]
  'update-settings': [settings: any]
  'variable-update': [name: string, value: string]
  'variable-add': [name: string, value: string]
  'variable-remove': [name: string]
}

const props = withDefaults(defineProps<Props>(), {
  variables: () => ({}),
  predefinedVariables: () => ({})
})
const emit = defineEmits<Emits>()

// 本地设置状态
const localSettings = ref({ ...props.optimizationSettings })

// 确保有默认的 focusAreas 数组
if (!localSettings.value.focusAreas) {
  localSettings.value.focusAreas = ['clarity', 'completeness']
}

// 监听外部设置变化
watch(() => props.optimizationSettings, (newSettings) => {
  localSettings.value = { ...newSettings }
  if (!localSettings.value.focusAreas) {
    localSettings.value.focusAreas = ['clarity', 'completeness']
  }
}, { deep: true })

// 事件处理
const closeSettings = () => {
  emit('update:show', false)
}

const saveSettings = () => {
  emit('update-settings', localSettings.value)
  closeSettings()
}

const resetSettings = () => {
  localSettings.value = {
    temperature: 0.7,
    maxTokens: 1000,
    focusArea: 'clarity',
    language: 'zh',
    focusAreas: ['clarity', 'completeness'],
    autoApplySuggestions: false,
    preserveStyle: true,
    enableQualityComparison: true
  }
}

const applyPreset = (preset: 'conservative' | 'balanced' | 'aggressive') => {
  const presets = {
    conservative: {
      temperature: 0.3,
      maxTokens: 800,
      focusAreas: ['clarity'],
      autoApplySuggestions: false,
      preserveStyle: true,
      enableQualityComparison: false
    },
    balanced: {
      temperature: 0.7,
      maxTokens: 1000,
      focusAreas: ['clarity', 'completeness', 'specificity'],
      autoApplySuggestions: false,
      preserveStyle: true,
      enableQualityComparison: true
    },
    aggressive: {
      temperature: 1.0,
      maxTokens: 1500,
      focusAreas: ['clarity', 'completeness', 'specificity', 'structure', 'examples'],
      autoApplySuggestions: true,
      preserveStyle: false,
      enableQualityComparison: true
    }
  }

  localSettings.value = {
    ...localSettings.value,
    ...presets[preset]
  }
}

// 变量管理事件处理
const handleVariableUpdate = (name: string, value: string) => {
  emit('variable-update', name, value)
}

const handleVariableAdd = (name: string, value: string) => {
  emit('variable-add', name, value)
}

const handleVariableRemove = (name: string) => {
  emit('variable-remove', name)
}
</script>