<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps({
  prefix: {
    type: String,
    default: 'icon',
  },
  name: {
    type: String,
    default: '',
  },
  className: {
    type: String,
    default: '',
  },
  staticContent: {
    type: String,
    default: '',
  },
})
const svgClass = computed(() => {
  if (props.className) {
    return `svg-icon ${props.className}`
  }
  return 'svg-icon'
})
</script>

<template>
  <div
    v-if="staticContent"
    v-dompurify-html="staticContent"
    class="svg-container"
    :class="svgClass"
    aria-hidden="true"
  ></div>
  <slot v-else />
</template>
<style lang="less" scope>
.svg-icon {
  width: 100%;
  height: 100%;
  display: block;
  overflow: hidden;
  fill: currentcolor;
}

.svg-container {
  width: 100%;
  height: 100%;

  svg {
    width: 100%;
    height: 100%;
    display: block;
    overflow: hidden;
    fill: currentcolor;
  }
}
</style>
