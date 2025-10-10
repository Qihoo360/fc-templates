<script setup lang="ts">
import { ref, toRefs, computed } from 'vue'
import { findComponent } from '@/views/dashboard/components/component-list.ts'

const componentWrapperInnerRef = ref(null)

const props = defineProps({
  active: {
    type: Boolean,
    default: false,
  },
  configItem: {
    type: Object,
    required: true,
  },
  canvasViewInfo: {
    type: Object,
    required: true,
  },
  showPosition: {
    required: false,
    type: String,
    default: 'preview',
  },
  canvasId: {
    type: String,
    default: 'canvas-main',
  },
})
const { configItem, showPosition } = toRefs(props)
const component = ref(null)
const wrapperId = 'wrapper-outer-id-' + configItem.value.id
const viewDemoInnerId = computed(() => 'enlarge-inner-content-' + configItem.value.id)
</script>

<template>
  <div :id="wrapperId" class="wrapper-outer">
    <div :id="viewDemoInnerId" ref="componentWrapperInnerRef" class="wrapper-inner">
      <div class="wrapper-inner-adaptor">
        <component
          :is="findComponent(configItem['component'])"
          ref="component"
          class="component"
          :canvas-view-info="canvasViewInfo"
          :view-info="canvasViewInfo[configItem.id]"
          :config-item="configItem"
          :show-position="showPosition"
          :disabled="true"
          :active="active"
        />
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.wrapper-outer {
  position: absolute;
  overflow: hidden;
  border-radius: 12px;
  .wrapper-inner {
    width: 100%;
    height: 100%;
    position: relative;
    background: #fff;
    background-size: 100% 100% !important;
    .wrapper-inner-adaptor {
      position: relative;
      transform-style: preserve-3d;
      width: 100%;
      height: 100%;
      .component {
        width: 100%;
        height: 100%;
      }
    }
  }
}
</style>
