<script setup lang="ts">
import icon_add_outlined from '@/assets/svg/icon_add_outlined.svg'
import { reactive, ref, toRefs, onBeforeMount, computed } from 'vue'
import { load_resource_prepare } from '@/views/dashboard/utils/canvasUtils'
import { Icon } from '@/components/icon-custom'
import ResourceTree from '@/views/dashboard/common/ResourceTree.vue'
import SQPreview from '@/views/dashboard/preview/SQPreview.vue'
import SQPreviewHead from '@/views/dashboard/preview/SQPreviewHead.vue'
import EmptyBackground from '@/views/dashboard/common/EmptyBackground.vue'
import EmptyBackgroundSvg from '@/views/dashboard/common/EmptyBackgroundSvg.vue'
import { dashboardStoreWithOut } from '@/stores/dashboard/dashboard.ts'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const dashboardStore = dashboardStoreWithOut()
const previewCanvasContainer = ref(null)
const dashboardPreview = ref(null)
const slideShow = ref(true)
const dataInitState = ref(true)
const state = reactive({
  canvasDataPreview: [],
  canvasStylePreview: {},
  canvasViewInfoPreview: {},
  dashboardInfo: {},
})

const props = defineProps({
  showPosition: {
    required: false,
    type: String,
    default: 'preview',
  },
  noClose: {
    required: false,
    type: Boolean,
    default: false,
  },
})

const { showPosition } = toRefs(props)

const resourceTreeRef = ref()

const hasTreeData = computed(() => {
  return resourceTreeRef.value?.hasData
})
const mounted = computed(() => {
  return resourceTreeRef.value?.mounted
})
function createNew() {
  resourceTreeRef.value?.createNewObject()
}

const stateInit = () => {
  state.canvasDataPreview = []
  state.canvasStylePreview = {}
  state.canvasViewInfoPreview = {}
  state.dashboardInfo = {}
}
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
const getPreviewStateInfo = () => {
  return state
}

const reload = (params: any) => {
  loadCanvasData(params)
}

const resourceNodeClick = (prams: any) => {
  loadCanvasData(prams)
}

// @ts-expect-error eslint-disable-next-line @typescript-eslint/ban-ts-comment
const previewShowFlag = computed(() => !!state.dashboardInfo?.name)

onBeforeMount(() => {
  if (showPosition.value === 'preview') {
    dashboardStore.canvasDataInit()
  }
})
const sideTreeStatus = ref(true)
defineExpose({
  getPreviewStateInfo,
})
</script>

<template>
  <div class="dv-preview dv-teleport-query no-padding">
    <el-aside
      ref="node"
      class="resource-area"
      :class="{ 'close-side': !slideShow, retract: !sideTreeStatus }"
    >
      <resource-tree
        v-show="slideShow"
        ref="resourceTreeRef"
        :cur-canvas-type="'dashboard'"
        :show-position="showPosition"
        @node-click="resourceNodeClick"
        @delete-cur-resource="stateInit"
      />
    </el-aside>
    <el-container
      v-loading="!dataInitState"
      class="preview-area"
      :class="{ 'no-data': !state.dashboardInfo }"
    >
      <template v-if="previewShowFlag">
        <SQPreviewHead :dashboard-info="state.dashboardInfo" @reload="reload" />
        <div id="sq-preview-content" ref="previewCanvasContainer" class="content">
          <SQPreview
            v-if="state.canvasStylePreview && dataInitState"
            ref="dashboardPreview"
            :dashboard-info="state.dashboardInfo"
            :component-data="state.canvasDataPreview"
            :canvas-style-data="state.canvasStylePreview"
            :canvas-view-info="state.canvasViewInfoPreview"
            :show-position="showPosition"
          ></SQPreview>
        </div>
      </template>
      <template v-else-if="hasTreeData && mounted">
        <EmptyBackgroundSvg :description="t('dashboard.select_dashboard_tips')" />
      </template>
      <template v-else-if="mounted">
        <EmptyBackground :description="t('dashboard.no_dashboard_info')" img-type="none">
          <el-button type="primary" @click="createNew">
            <template #icon>
              <Icon name="icon_add_outlined">
                <icon_add_outlined class="svg-icon" />
              </Icon>
            </template>
            {{ t('dashboard.new_dashboard') }}
          </el-button>
        </EmptyBackground>
      </template>
    </el-container>
  </div>
</template>

<style lang="less">
.dv-preview {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  background: #ffffff;
  position: relative;
  border-radius: 12px;

  .resource-area {
    --ed-aside-width: 260px;

    position: relative;
    height: 100%;
    padding: 0;

    box-shadow: 0 0 3px #d7d7d7;
    z-index: 1;

    overflow: visible;

    &.retract {
      display: none;
    }
  }

  .preview-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
    overflow-y: auto;
    position: relative;
    //transition: 0.5s;

    &.no-data {
      background-color: rgba(245, 246, 247, 1);
    }

    .content {
      position: relative;
      display: flex;
      width: 100%;
      height: 100%;
      overflow-x: hidden;
      overflow-y: auto;
      align-items: center;
    }
  }
}

.close-side {
  width: 0 !important;
  padding: 0 !important;
}

.flexible-button-area {
  position: absolute;
  height: 60px;
  width: 16px;
  left: 0;
  top: calc(50% - 30px);
  background-color: #ffffff;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  border-top: 1px solid #d7d7d7;
  border-right: 1px solid #d7d7d7;
  border-bottom: 1px solid #d7d7d7;
}
</style>
