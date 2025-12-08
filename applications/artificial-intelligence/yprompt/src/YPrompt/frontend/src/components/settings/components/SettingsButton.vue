<template>
  <button
    @click="$emit('open')"
    class="fixed top-4 right-4 z-50 p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
    title="设置"
  >
    <Settings class="w-5 h-5 text-gray-600" />
  </button>
</template>

<script setup lang="ts">
import { Settings } from 'lucide-vue-next'

defineEmits<{
  open: []
}>()
</script>
