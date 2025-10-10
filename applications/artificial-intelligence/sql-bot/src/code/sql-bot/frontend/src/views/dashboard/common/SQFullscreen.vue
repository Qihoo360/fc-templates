<script lang="ts" setup>
import { dashboardStoreWithOut } from '@/stores/dashboard/dashboard.ts'

const dashboardStore = dashboardStoreWithOut()
import { onBeforeUnmount, onMounted } from 'vue'
import { useEmitt } from '@/utils/useEmitt.ts'
defineProps({
  themes: {
    type: String,
    default: 'light',
  },
  componentType: {
    type: String,
    default: 'button',
  },
  showPosition: {
    required: false,
    type: String,
    default: 'preview',
  },
})

const fullscreenChange = () => {
  const isFullscreen = !!document.fullscreenElement
  dashboardStore.setFullscreenFlag(isFullscreen)
  setTimeout(() => {
    useEmitt().emitter.emit('custom-canvas-resize')
  }, 100)
}

const toggleFullscreen = () => {
  const bodyNode = document.querySelector('body')
  if (!document.fullscreenElement) {
    bodyNode?.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && document.fullscreenElement) {
    document.exitFullscreen()
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', fullscreenChange)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', fullscreenChange)
  document.removeEventListener('keydown', handleKeydown)
})

defineExpose({
  toggleFullscreen,
})
</script>

<template><span></span></template>

<style lang="less" scoped></style>
