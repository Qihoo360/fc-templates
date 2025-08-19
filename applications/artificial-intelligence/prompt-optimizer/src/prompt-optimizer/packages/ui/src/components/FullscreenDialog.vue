<template>
  <Teleport to="body">
    <div v-if="modelValue" 
         class="fixed inset-0 theme-mask z-[60] flex items-center justify-center overflow-y-auto"
         @click="onBackdropClick">
      <div class="relative theme-manager-container min-h-[80vh] h-[90vh] w-[90vw] m-4 flex flex-col">
        <!-- 标题栏 -->
        <div class="flex items-center justify-between p-4 border-b theme-manager-border flex-none">
          <h3 class="text-lg font-semibold theme-manager-text">{{ title }}</h3>
          <button
            @click="close"
            class="theme-manager-text-secondary hover:theme-manager-text transition-colors text-xl"
          >
            ×
          </button>
        </div>
        
        <!-- 内容区域 -->
        <div class="flex-1 min-h-0 p-4">
          <slot></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

// 关闭弹窗
const close = () => {
  emit('update:modelValue', false)
}

const onBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    close()
  }
}

// 监听ESC键
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.modelValue) {
    close()
  }
}

// 挂载和卸载事件监听器
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.overflow-auto {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.overflow-auto::-webkit-scrollbar {
  display: none;
}
</style>