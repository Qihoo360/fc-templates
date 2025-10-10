<script setup lang="ts">
import SQPreview from '@/views/dashboard/preview/SQPreview.vue'
import { load_resource_prepare } from '@/views/dashboard/utils/canvasUtils.ts'
import { onMounted, reactive, ref } from 'vue'
import router from '@/router'

const previewCanvasContainer = ref(null)
const dashboardPreview = ref(null)
const dataInitState = ref(true)
const downloadStatus = ref(false)
const state = reactive({
  resourceId: null,
  canvasDataPreview: [],
  canvasStylePreview: {},
  canvasViewInfoPreview: {},
  dashboardInfo: {},
})

onMounted(() => {
  // @ts-expect-error eslint-disable-next-line @typescript-eslint/ban-ts-comment
  state.resourceId = router.currentRoute.value.query.resourceId
  if (state.resourceId) {
    loadCanvasData({ id: state.resourceId })
  }
})

const loadCanvasData = (params: any) => {
  dataInitState.value = false
  load_resource_prepare(
    { id: params.id },
    function ({ dashboardInfo, canvasDataResult, canvasStyleResult, canvasViewInfoPreview }) {
      state.canvasDataPreview = canvasDataResult
      state.canvasStylePreview = canvasStyleResult
      state.canvasViewInfoPreview = canvasViewInfoPreview
      state.dashboardInfo = dashboardInfo
      dataInitState.value = true
    }
  )
}
</script>

<template>
  <div id="sq-preview-content" ref="previewCanvasContainer" class="content">
    <SQPreview
      v-if="state.canvasStylePreview && dataInitState"
      ref="dashboardPreview"
      :dashboard-info="state.dashboardInfo"
      :component-data="state.canvasDataPreview"
      :canvas-style-data="state.canvasStylePreview"
      :canvas-view-info="state.canvasViewInfoPreview"
      :download-status="downloadStatus"
    ></SQPreview>
  </div>
</template>

<style scoped lang="less">
.content {
  position: relative;
  display: flex;
  width: 100%;
  height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  align-items: center;
}
</style>
