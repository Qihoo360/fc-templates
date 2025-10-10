<script setup lang="ts">
import type { PropType } from 'vue'

defineProps({
  sizeList: {
    type: Array as PropType<number[]>,
    required: false,
    // eslint-disable-next-line vue/require-valid-default-prop
    default: [16, 16, 16, 16],
  },
})

const shadowStyle = (size: number, index: number) => {
  if (index === 0) {
    return {
      top: 0,
      left: 0,
      width: '100%',
      height: `${size}px`,
    }
  } else if (index === 1) {
    return {
      top: 0,
      right: 0,
      width: `${size}px`,
      height: '100%',
    }
  } else if (index === 2) {
    return {
      bottom: 0,
      left: 0,
      width: '100%',
      height: `${size}px`,
    }
  } else if (index === 3) {
    return {
      top: 0,
      left: 0,
      width: `${size}px`,
      height: '100%',
    }
  }
}
</script>

<template>
  <div
    v-for="(size, index) in sizeList"
    :key="index"
    class="dragHandle dragArea"
    :style="shadowStyle(size, index)"
  ></div>
</template>

<style scoped lang="less">
.dragArea {
  opacity: 0;
}

.dragHandle {
  background: #c1e2e8;
  position: absolute;
  cursor: move !important;
  z-index: 3;
}
</style>
