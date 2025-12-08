<template>
  <div class="space-y-6">
    <!-- 基本设置 -->
    <div>
      <h3 class="text-lg font-medium text-gray-900 mb-4">基本设置</h3>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">温度值</label>
          <div class="flex items-center space-x-3">
            <input
              :value="localSettings.temperature"
              @input="localSettings.temperature = parseFloat($event.target.value)"
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
            :value="localSettings.maxTokens"
            @input="localSettings.maxTokens = parseInt($event.target.value)"
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
    <div>
      <h3 class="text-lg font-medium text-gray-900 mb-4">优化重点</h3>
      
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
    <div>
      <h3 class="text-lg font-medium text-gray-900 mb-4">语言设置</h3>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">输出语言</label>
        <select
          :value="localSettings.language"
          @input="localSettings.language = $event.target.value"
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
    <div>
      <h3 class="text-lg font-medium text-gray-900 mb-4">高级设置</h3>
      
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
      <h3 class="text-lg font-medium text-gray-900 mb-4">预设配置</h3>
      
      <div class="grid grid-cols-3 gap-3">
        <button
          @click="applyPreset('conservative')"
          :class="getPresetButtonClass('conservative')"
        >
          <div :class="`text-sm font-medium ${getPresetTextClass('conservative')}`">保守</div>
          <div :class="`text-xs ${currentPreset.value === 'conservative' ? 'text-blue-600' : 'text-gray-600'}`">最小改动</div>
        </button>

        <button
          @click="applyPreset('balanced')"
          :class="getPresetButtonClass('balanced')"
        >
          <div :class="`text-sm font-medium ${getPresetTextClass('balanced')}`">平衡</div>
          <div :class="`text-xs ${currentPreset.value === 'balanced' ? 'text-blue-600' : 'text-blue-600'}`">推荐设置</div>
        </button>

        <button
          @click="applyPreset('aggressive')"
          :class="getPresetButtonClass('aggressive')"
        >
          <div :class="`text-sm font-medium ${getPresetTextClass('aggressive')}`">激进</div>
          <div :class="`text-xs ${currentPreset.value === 'aggressive' ? 'text-blue-600' : 'text-gray-600'}`">大幅优化</div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, watch, onMounted } from 'vue'

interface OptimizationSettings {
  temperature: number
  maxTokens: number
  focusArea: string
  language: string
  focusAreas?: string[]
  autoApplySuggestions?: boolean
  preserveStyle?: boolean
  enableQualityComparison?: boolean
}

interface Props {
  optimizationSettings?: OptimizationSettings
}

interface Emits {
  'update-settings': [settings: OptimizationSettings]
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

// 简化的本地状态，确保有默认值
const localSettings = ref({
  temperature: 0.7,
  maxTokens: 1000,
  focusArea: 'clarity',
  language: 'zh',
  focusAreas: ['clarity', 'completeness'],
  autoApplySuggestions: false,
  preserveStyle: true,
  enableQualityComparison: true
})

// 当前预设状态
const currentPreset = ref<'none' | 'conservative' | 'balanced' | 'aggressive'>('none')

// 在组件挂载时应用props
onMounted(() => {
  console.log('OptimizeTab mounted with props:', props.optimizationSettings)
  if (props.optimizationSettings) {
    localSettings.value = { ...localSettings.value, ...props.optimizationSettings }
    // 检测当前预设
    detectCurrentPreset()
  }
})

// 只在props真正变化时更新本地状态（防止递归）
let ignoreNextUpdate = false
watch(() => props.optimizationSettings, (newSettings) => {
  if (newSettings && !ignoreNextUpdate) {
    ignoreNextUpdate = true
    localSettings.value = { ...localSettings.value, ...newSettings }
    setTimeout(() => { ignoreNextUpdate = false }, 0)
  }
}, { deep: true, immediate: true })

// 手动触发设置更新（避免递归）
const triggerSettingsUpdate = () => {
  if (!ignoreNextUpdate) {
    emit('update-settings', { ...localSettings.value })
  }
}

// 检测当前预设
const detectCurrentPreset = () => {
  const settings = localSettings.value
  const presets = {
    conservative: {
      temperature: 0.3,
      maxTokens: 800,
      focusArea: 'clarity',
      language: 'zh',
      focusAreas: ['clarity'],
      autoApplySuggestions: false,
      preserveStyle: true,
      enableQualityComparison: false
    },
    balanced: {
      temperature: 0.7,
      maxTokens: 1000,
      focusArea: 'clarity',
      language: 'zh',
      focusAreas: ['clarity', 'completeness', 'specificity'],
      autoApplySuggestions: false,
      preserveStyle: true,
      enableQualityComparison: true
    },
    aggressive: {
      temperature: 1.0,
      maxTokens: 1500,
      focusArea: 'clarity',
      language: 'zh',
      focusAreas: ['clarity', 'completeness', 'specificity', 'structure', 'examples'],
      autoApplySuggestions: true,
      preserveStyle: false,
      enableQualityComparison: true
    }
  }

  // 检查是否匹配某个预设
  for (const [presetName, presetConfig] of Object.entries(presets)) {
    const matches = Object.entries(presetConfig).every(([key, value]) => {
      if (Array.isArray(value)) {
        return Array.isArray(settings[key as keyof typeof settings]) && 
               JSON.stringify(settings[key as keyof typeof settings]) === JSON.stringify(value)
      }
      return settings[key as keyof typeof settings] === value
    })
    
    if (matches) {
      currentPreset.value = presetName as 'conservative' | 'balanced' | 'aggressive'
      return
    }
  }
  
  currentPreset.value = 'none'
}

// 获取按钮样式类
const getPresetButtonClass = (preset: 'conservative' | 'balanced' | 'aggressive') => {
  const baseClass = 'p-3 border rounded-lg hover:bg-gray-50 text-center transition-colors'
  
  if (currentPreset.value === preset) {
    if (preset === 'balanced') {
      return `${baseClass} border-blue-200 bg-blue-50`
    }
    return `${baseClass} border-blue-300 bg-blue-50`
  }
  
  return `${baseClass} border-gray-200`
}

// 获取文字颜色类
const getPresetTextClass = (preset: 'conservative' | 'balanced' | 'aggressive') => {
  if (currentPreset.value === preset) {
    if (preset === 'balanced') {
      return 'text-blue-800'
    }
    return 'text-blue-700'
  }
  return 'text-gray-800'
}

// 预设配置
const applyPreset = (preset: 'conservative' | 'balanced' | 'aggressive') => {
  const presets = {
    conservative: {
      temperature: 0.3,
      maxTokens: 800,
      focusArea: 'clarity',
      language: 'zh',
      focusAreas: ['clarity'],
      autoApplySuggestions: false,
      preserveStyle: true,
      enableQualityComparison: false
    },
    balanced: {
      temperature: 0.7,
      maxTokens: 1000,
      focusArea: 'clarity',
      language: 'zh',
      focusAreas: ['clarity', 'completeness', 'specificity'],
      autoApplySuggestions: false,
      preserveStyle: true,
      enableQualityComparison: true
    },
    aggressive: {
      temperature: 1.0,
      maxTokens: 1500,
      focusArea: 'clarity',
      language: 'zh',
      focusAreas: ['clarity', 'completeness', 'specificity', 'structure', 'examples'],
      autoApplySuggestions: true,
      preserveStyle: false,
      enableQualityComparison: true
    }
  }

  // 更新设置和预设状态
  Object.assign(localSettings.value, presets[preset])
  currentPreset.value = preset
  
  // 立即emit更新事件
  triggerSettingsUpdate()
}
</script>