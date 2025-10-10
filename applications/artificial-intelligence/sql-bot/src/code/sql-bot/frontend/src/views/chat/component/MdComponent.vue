<script setup lang="ts">
import md from '@/utils/markdown.ts'
import 'highlight.js/styles/github.min.css'
import 'github-markdown-css/github-markdown-light.css'
import { computed } from 'vue'

const props = defineProps<{
  message?: string
}>()

const renderMd = computed(() => {
  return md.render(props.message ?? '')
})
</script>

<template>
  <div v-dompurify-html="renderMd" class="markdown-body md-render-container"></div>
</template>

<style lang="less">
.md-render-container {
  .hljs {
    overflow: auto;
    padding: 1rem;
    display: block;
  }

  //ul {
  //  padding-left: 16px;
  //}
  //ol {
  //  padding-left: 16px;
  //}
}
</style>
