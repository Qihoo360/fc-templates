<!-- 优化模式选择器组件 - 简化版 -->
<template>
  <div class="optimization-mode-selector">
    <div class="inline-flex theme-background-surface rounded theme-border-strong text-[10px]">
      <button
        @click="updateOptimizationMode('system')"
        :class="[
          'px-1.5 py-0.5 transition-colors duration-150 rounded-l',
          'focus:outline-none focus:ring-1 focus:ring-blue-400',
          modelValue === 'system'
            ? 'theme-button-toggle-active'
            : 'theme-button-toggle-inactive'
        ]"
        :aria-pressed="modelValue === 'system'"
        :title="t('promptOptimizer.systemPromptHelp')"
      >
        {{ t('promptOptimizer.systemPrompt') }}
      </button>
      <div class="w-px theme-border-strong"></div>
      <button
        @click="updateOptimizationMode('user')"
        :class="[
          'px-1.5 py-0.5 transition-colors duration-150 rounded-r',
          'focus:outline-none focus:ring-1 focus:ring-blue-400',
          modelValue === 'user'
            ? 'theme-button-toggle-active'
            : 'theme-button-toggle-inactive'
        ]"
        :aria-pressed="modelValue === 'user'"
        :title="t('promptOptimizer.userPromptHelp')"
      >
        {{ t('promptOptimizer.userPrompt') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { OptimizationMode } from '@prompt-optimizer/core'

const { t } = useI18n()

interface Props {
  modelValue: OptimizationMode
}

interface Emits {
  (e: 'update:modelValue', value: OptimizationMode): void
  (e: 'change', value: OptimizationMode): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/**
 * 更新优化模式
 */
const updateOptimizationMode = (mode: OptimizationMode) => {
  if (mode !== props.modelValue) {
    emit('update:modelValue', mode)
    emit('change', mode)
  }
}
</script>

<style scoped>
.optimization-mode-selector {
  display: inline-flex;
}

/* 微妙的按钮反馈 */
.optimization-mode-selector button:active {
  transform: scale(0.95);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .optimization-mode-selector {
    width: 100%;
  }

  .optimization-mode-selector .inline-flex {
    display: flex;
    width: 100%;
  }

  .optimization-mode-selector button {
    flex: 1;
  }
}
</style> 