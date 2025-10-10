<script setup lang="ts">
import RichTextEditor from '@/views/dashboard/components/sq-text-t7/index.vue'
</script>

<template>
  <div id="sq-preview-content" ref="previewCanvasContainer" class="content">
    <h1>文章编辑器</h1>
    <RichTextEditor />
  </div>
</template>

<style scoped lang="less">
.content {
  position: relative;
  display: flex;
  width: 100%;
  height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  align-items: center;
}
</style>
