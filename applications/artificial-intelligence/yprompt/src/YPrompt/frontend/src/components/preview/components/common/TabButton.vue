<template>
  <button
    ref="buttonRef"
    @click="$emit('click')"
    :class="[
      'px-3 py-1 rounded text-sm transition-colors whitespace-nowrap flex-shrink-0',
      isActive ? activeClass : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    ]"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

defineProps<{
  isActive: boolean
  activeClass: string
}>()

const emit = defineEmits<{
  click: []
  mounted: [element: HTMLButtonElement]
}>()

const buttonRef = ref<HTMLButtonElement>()

onMounted(() => {
  if (buttonRef.value) {
    emit('mounted', buttonRef.value)
  }
})
</script>
