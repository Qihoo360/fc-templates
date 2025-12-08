<template>
  <component :is="iconComponent" class="w-5 h-5" />
</template>

<script setup lang="ts">
import { computed, h } from 'vue'

const props = defineProps<{
  name: string
}>()

// SVG图标组件映射
const iconComponents = {
  home: () => h('svg', {
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    class: 'w-5 h-5'
  }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
    })
  ]),
  
  sparkles: () => h('svg', {
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    class: 'w-5 h-5'
  }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'
    })
  ]),
  
  beaker: () => h('svg', {
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    class: 'w-5 h-5'
  }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M6 3l6 6m0 0l6-6M12 9l-6 6m6-6l6 6m-6-6v12'
    }),
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M4 20h16M7 17h10'
    })
  ]),
  
  collection: () => h('svg', {
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    class: 'w-5 h-5'
  }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z'
    })
  ]),
  
  cog: () => h('svg', {
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    class: 'w-5 h-5'
  }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
    }),
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z'
    })
  ])
}

const iconComponent = computed(() => {
  return iconComponents[props.name as keyof typeof iconComponents] || iconComponents.home
})
</script>
