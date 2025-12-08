<template>
  <div ref="tabContainerEl" class="flex space-x-2 mb-4 flex-shrink-0 overflow-x-auto scrollbar-hide scroll-smooth">
    <div class="flex space-x-2 min-w-max px-1">
      <div v-if="isGenerating" class="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm whitespace-nowrap">
        <RefreshCw class="w-3 h-3 animate-spin mr-1" />
        <span>生成中</span>
      </div>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RefreshCw } from 'lucide-vue-next'

defineProps<{
  isGenerating: boolean
}>()

const tabContainerEl = ref<HTMLElement>()

const emit = defineEmits<{
  mounted: [element: HTMLElement]
}>()

onMounted(() => {
  if (tabContainerEl.value) {
    emit('mounted', tabContainerEl.value)
  }
})
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
