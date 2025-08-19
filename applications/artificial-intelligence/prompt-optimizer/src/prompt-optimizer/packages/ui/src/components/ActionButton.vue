<template>
  <button
    class="theme-icon-button"
    @click="$emit('click')"
    :disabled="loading"
  >
    <span class="text-base sm:text-lg">{{ loading ? '⏳' : icon }}</span>
    <span class="text-sm max-md:hidden">{{ loading ? loadingText || t('common.loading') : text }}</span>
  </button>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  icon: string
  text: string
  loading?: boolean
  loadingText?: string
}>()

defineEmits<{
  (e: 'click'): void
}>()
</script>