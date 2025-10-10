<script setup lang="ts">
import { computed } from 'vue'
import { ElConfigProvider } from 'element-plus-secondary'
import { getElementLocale } from '@/i18n'
const elLanguage = computed(() => {
  return getElementLocale()
})
</script>

<template>
  <el-config-provider :locale="elLanguage">
    <router-view />
  </el-config-provider>
</template>

<style scoped></style>
