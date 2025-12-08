<template>
  <div class="diff-viewer">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-800">版本对比</h3>
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-600">
          {{ leftLabel }} vs {{ rightLabel }}
        </span>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 内容选择 -->
    <div class="flex space-x-4 mb-4 border-b">
      <button
        @click="activeContent = 'system'"
        :class="[
          'px-4 py-2 text-sm font-medium transition-colors border-b-2',
          activeContent === 'system'
            ? 'text-blue-600 border-blue-600'
            : 'text-gray-500 border-transparent hover:text-gray-700'
        ]"
      >
        系统提示词
      </button>
      <button
        @click="activeContent = 'user'"
        :class="[
          'px-4 py-2 text-sm font-medium transition-colors border-b-2',
          activeContent === 'user'
            ? 'text-blue-600 border-blue-600'
            : 'text-gray-500 border-transparent hover:text-gray-700'
        ]"
      >
        用户提示词
      </button>
    </div>

    <!-- Diff 显示区域 -->
    <div class="bg-white border rounded-lg overflow-hidden">
      <div class="max-h-96 overflow-y-auto">
        <div class="font-mono text-sm">
          <div
            v-for="(line, index) in diffLines"
            :key="index"
            :class="getLineClass(line)"
            class="px-4 py-1 border-b border-gray-100 last:border-b-0"
          >
            <div class="flex items-start">
              <span class="inline-block w-8 text-xs text-gray-400 select-none">
                {{ getLineNumber(line, index) }}
              </span>
              <span class="flex-1 whitespace-pre-wrap">{{ getLineContent(line) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="mt-4 flex items-center justify-between text-sm text-gray-600">
      <div class="flex items-center space-x-4">
        <span class="flex items-center">
          <span class="w-3 h-3 bg-green-100 border border-green-300 rounded mr-1"></span>
          新增 {{ stats.additions }} 行
        </span>
        <span class="flex items-center">
          <span class="w-3 h-3 bg-red-100 border border-red-300 rounded mr-1"></span>
          删除 {{ stats.deletions }} 行
        </span>
        <span class="flex items-center">
          <span class="w-3 h-3 bg-blue-100 border border-blue-300 rounded mr-1"></span>
          修改 {{ stats.modifications }} 行
        </span>
      </div>
      <button
        @click="copyDiffText"
        class="text-blue-600 hover:text-blue-700 flex items-center gap-1"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        复制Diff
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, watch } from 'vue'
import { copyToClipboard as copyUtil } from '@/utils/clipboardUtils'

interface Props {
  leftContent: string
  rightContent: string
  leftLabel?: string
  rightLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  leftLabel: '原始版本',
  rightLabel: '当前版本'
})

const emit = defineEmits<{
  close: []
}>()

const activeContent = ref<'system' | 'user'>('system')

// 简单的diff算法实现
const computeDiff = (left: string, right: string) => {
  const leftLines = left.split('\n')
  const rightLines = right.split('\n')
  
  const diff: Array<{
    type: 'equal' | 'insert' | 'delete' | 'modify'
    content: string
    leftLine?: number
    rightLine?: number
  }> = []
  
  let leftIndex = 0
  let rightIndex = 0
  
  while (leftIndex < leftLines.length || rightIndex < rightLines.length) {
    const leftLine = leftLines[leftIndex]
    const rightLine = rightLines[rightIndex]
    
    if (leftIndex >= leftLines.length) {
      // 右侧剩余行 - 新增
      diff.push({
        type: 'insert',
        content: rightLine,
        rightLine: rightIndex + 1
      })
      rightIndex++
    } else if (rightIndex >= rightLines.length) {
      // 左侧剩余行 - 删除
      diff.push({
        type: 'delete',
        content: leftLine,
        leftLine: leftIndex + 1
      })
      leftIndex++
    } else if (leftLine === rightLine) {
      // 相同行
      diff.push({
        type: 'equal',
        content: leftLine,
        leftLine: leftIndex + 1,
        rightLine: rightIndex + 1
      })
      leftIndex++
      rightIndex++
    } else {
      // 不同行 - 简单处理为删除+新增
      diff.push({
        type: 'delete',
        content: leftLine,
        leftLine: leftIndex + 1
      })
      diff.push({
        type: 'insert',
        content: rightLine,
        rightLine: rightIndex + 1
      })
      leftIndex++
      rightIndex++
    }
  }
  
  return diff
}

// 获取当前对比的内容
const currentContent = computed(() => {
  // 这里应该根据activeContent获取对应的系统或用户提示词
  // 为了简化，暂时使用传入的内容
  return {
    left: props.leftContent,
    right: props.rightContent
  }
})

// 计算diff结果
const diffLines = computed(() => {
  return computeDiff(currentContent.value.left, currentContent.value.right)
})

// 统计信息
const stats = computed(() => {
  let additions = 0
  let deletions = 0
  let modifications = 0
  
  diffLines.value.forEach(line => {
    if (line.type === 'insert') additions++
    else if (line.type === 'delete') deletions++
    else if (line.type === 'modify') modifications++
  })
  
  return { additions, deletions, modifications }
})

// 获取行样式
const getLineClass = (line: any) => {
  switch (line.type) {
    case 'insert':
      return 'bg-green-50 border-l-4 border-green-400'
    case 'delete':
      return 'bg-red-50 border-l-4 border-red-400'
    case 'modify':
      return 'bg-blue-50 border-l-4 border-blue-400'
    default:
      return 'bg-gray-50'
  }
}

// 获取行号
const getLineNumber = (line: any, _index: number) => {
  if (line.type === 'equal') {
    return `${line.leftLine || ''}`
  } else if (line.type === 'insert') {
    return line.rightLine ? `${line.rightLine}` : ''
  } else if (line.type === 'delete') {
    return line.leftLine ? `${line.leftLine}` : ''
  }
  return ''
}

// 获取行内容
const getLineContent = (line: any) => {
  return line.content
}

// 复制diff文本
const copyDiffText = () => {
  const diffText = diffLines.value
    .map(line => {
      const prefix = line.type === 'insert' ? '+' : line.type === 'delete' ? '-' : ' '
      return `${prefix}${line.content}`
    })
    .join('\n')
  
  copyUtil(diffText).then(() => {
    // 可以显示一个提示
    console.log('Diff copied to clipboard')
  })
}

// 监听内容变化，重新计算diff
watch([() => props.leftContent, () => props.rightContent], () => {
  // diff会自动重新计算
}, { immediate: true })
</script>