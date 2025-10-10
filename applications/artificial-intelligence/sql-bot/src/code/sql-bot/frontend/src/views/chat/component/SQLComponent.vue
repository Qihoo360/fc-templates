<script setup lang="ts">
import 'highlight.js/styles/github.min.css'
import 'github-markdown-css/github-markdown-light.css'
import hljs from 'highlight.js'

defineProps<{
  sql: string
}>()
</script>

<template>
  <pre class="hljs">
    <div
      v-dompurify-html="hljs.highlight(sql, { language: 'sql', ignoreIllegals: true }).value"
    ></div>
  </pre>
</template>

<style lang="less">
.hljs {
  overflow: auto;
  padding: 1rem;
  display: block;

  background: rgba(245, 246, 247, 1);
  border: 1px solid rgba(222, 224, 227, 1);
  border-radius: 6px;
}
</style>
