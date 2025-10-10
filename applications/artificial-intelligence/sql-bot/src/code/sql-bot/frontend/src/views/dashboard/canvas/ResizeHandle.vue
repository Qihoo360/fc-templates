<script setup lang="ts">
defineProps({
  startResize: {
    type: Function,
    default: () => {
      return {}
    },
  },
})
const cursors = {
  lt: 'nw',
  t: 'n',
  rt: 'ne',
  r: 'e',
  rb: 'se',
  b: 's',
  lb: 'sw',
  l: 'w',
}

function getPointStyle(point: string) {
  const hasT = /t/.test(point)
  const hasB = /b/.test(point)
  const hasL = /l/.test(point)
  const hasR = /r/.test(point)
  let newLeft = '0px'
  let newTop = '0px'

  // Points at the four corners
  if (point.length === 2) {
    newLeft = hasL ? '3px' : 'calc(100% - 3px)'
    newTop = hasT ? '3px' : 'calc(100% - 3px)'
  } else {
    // The point between the upper and lower points, with a width centered
    if (hasT || hasB) {
      newLeft = '50%'
      newTop = hasT ? '0px' : '100%'
    }

    // The points on both sides are centered in height
    if (hasL || hasR) {
      newLeft = hasL ? '0px' : '100%'
      newTop = '50%'
    }
  }

  return {
    marginLeft: '-4px',
    marginTop: '-4px',
    left: `${newLeft}`,
    top: `${newTop}`,
    // @ts-expect-error eslint-disable-next-line @typescript-eslint/ban-ts-comment
    cursor: `${cursors[point]}-resize`,
  }
}

const pointList = ['lt', 't', 'rt', 'r', 'rb', 'b', 'lb', 'l']
</script>

<template>
  <div
    v-for="point in pointList"
    :key="point"
    class="resizeHandle"
    :style="getPointStyle(point)"
    @mousedown="startResize($event, point)"
  ></div>
</template>

<style scoped lang="less">
@import '../css/CanvasStyle.less';
</style>
