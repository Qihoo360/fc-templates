<template>
    <div class="text-diff theme-textdiff">
      <!-- 对比模式切换 -->
      <div class="diff-header theme-textdiff-header" v-if="showHeader">
        <div class="diff-controls">
          <button 
            class="diff-toggle-btn theme-textdiff-toggle"
            @click="$emit('toggleDiff')"
            :aria-label="isEnabled ? '关闭对比模式' : '开启对比模式'"
          >
            {{ isEnabled ? '关闭对比' : '开启对比' }}
          </button>
          
          <div v-if="isEnabled && compareResult" class="diff-stats">
            <span class="stat theme-textdiff-stat-added" v-if="compareResult.summary.additions > 0">
              +{{ compareResult.summary.additions }}
            </span>
            <span class="stat theme-textdiff-stat-removed" v-if="compareResult.summary.deletions > 0">
              -{{ compareResult.summary.deletions }}
            </span>
          </div>
        </div>
      </div>
  
      <!-- 文本内容 -->
      <div class="text-diff-content theme-textdiff-content flex-1 min-h-0">
        <template v-if="isEnabled && compareResult">
          <!-- 对比模式：显示高亮的差异 -->
          <div class="diff-text">
            <span
              v-for="fragment in compareResult.fragments"
              :key="fragment.index"
              :class="getFragmentClass(fragment.type)"
              class="text-fragment"
            >{{ fragment.text }}</span>
          </div>
        </template>
        
        <template v-else>
          <!-- 普通模式：显示原始文本 -->
          <div class="normal-text">
            {{ displayText }}
          </div>
        </template>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue'
  import type { CompareResult, ChangeType } from '@prompt-optimizer/core'
  
  interface Props {
    /** 原始文本 */
    originalText: string
    /** 优化后的文本 */
    optimizedText: string
    /** 对比结果 */
    compareResult?: CompareResult
    /** 是否启用对比模式 */
    isEnabled: boolean
    /** 是否显示头部控制栏 */
    showHeader?: boolean
    /** 显示的文本类型：original | optimized */
    displayMode?: 'original' | 'optimized'
  }
  
  interface Emits {
    (e: 'toggleDiff'): void
  }
  
  const props = withDefaults(defineProps<Props>(), {
    showHeader: true,
    displayMode: 'optimized'
  })
  
  defineEmits<Emits>()
  
  const displayText = computed(() => {
    return props.displayMode === 'original' ? props.originalText : props.optimizedText
  })
  
  const getFragmentClass = (type: ChangeType): string => {
  switch (type) {
    case 'added':
      return 'theme-textdiff-added'
    case 'removed':
      return 'theme-textdiff-removed'
    case 'unchanged':
    default:
      return 'theme-textdiff-unchanged'
  }
}
  </script>
  
  <style scoped>
.text-diff {
  /* 使用 flex 布局自适应父容器高度 */
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  border-radius: 8px;
}

.diff-header {
  flex-shrink: 0;
  padding: 12px 16px;
  border-bottom: 1px solid currentColor;
  border-opacity: 0.2;
}

.diff-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.diff-toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.diff-stats {
  display: flex;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
}

.stat {
  padding: 2px 6px;
  border-radius: 4px;
}

.text-diff-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  box-sizing: border-box; /* 确保内边距被计算在高度之内 */
  padding-bottom: 3rem;   /* 将缓冲区作为内边距，从根本上解决问题 */
}

.diff-text,
.normal-text {
  padding: 0.75rem 1rem; /* 移除底部填充，改用伪元素实现 */
  line-height: 1.6;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 1rem;
  white-space: pre-wrap;
  word-break: break-word;
  /* 确保内容可以正常显示和滚动 */
  width: 100%;
  box-sizing: border-box;
}

.text-fragment {
  position: relative;
  border-radius: 2px;
  padding: 1px 2px;
}

/* 添加删除线样式 */
:deep(.theme-textdiff-removed) {
  text-decoration: line-through;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .diff-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .diff-stats {
    justify-content: center;
  }
}
</style>