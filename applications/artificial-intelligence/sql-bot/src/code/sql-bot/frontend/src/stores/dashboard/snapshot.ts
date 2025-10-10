import { defineStore, storeToRefs } from 'pinia'
import _ from 'lodash'
import { dashboardStoreWithOut } from '@/stores/dashboard/dashboard.ts'
import { store } from '@/stores'

const dashboardStore = dashboardStoreWithOut()
const { dashboardInfo, componentData, canvasStyleData, canvasViewInfo, dataPrepareState } =
  storeToRefs(dashboardStore)

let defaultCanvasInfo = {
  componentData: [],
  canvasStyleData: {},
  canvasViewInfo: {},
  cacheViewIdInfo: {
    snapshotCacheViewCalc: [],
    snapshotCacheViewRender: [],
  },
}

// Storage snapshot structure {componentData:[],canvasStyleData:{},canvasViewInfo:{}}
export const snapshotStore = defineStore('snapshot', {
  state: () => {
    return {
      snapshotDisableTime: 1, // Snapshot disable time (resolves style changes caused by redo/undo)
      styleChangeTimes: -1, // Component style modification count
      cacheStyleChangeTimes: 0, // Unsaved component style modification count in the dashboard
      snapshotCacheTimes: 0, // Current unsnapshot modification count (timed cache, cached every 5 seconds; used for minor changes like style adjustments)
      snapshotData: [], // Editor snapshot data
      snapshotIndex: -1, // Snapshot index
    }
  },
  actions: {
    initSnapShot() {
      this.styleChangeTimes = -1
      this.cacheStyleChangeTimes = 0
      this.snapshotCacheTimes = 0
      this.snapshotData = []
      this.snapshotIndex = -1
    },
    //Regularly check the number of changes, and if there are any changes, perform mirroring processing
    snapshotCatchToStore() {
      if (this.snapshotCacheTimes) {
        this.recordSnapshot()
      }
    },
    recordSnapshotCache() {
      if (dataPrepareState.value) {
        this.snapshotCacheTimes++
      }
    },
    undo() {
      if (this.snapshotIndex > 0) {
        this.snapshotIndex--
        const componentSnapshot =
          _.cloneDeep(this.snapshotData[this.snapshotIndex]) || getDefaultCanvasInfo()
        // @ts-expect-error eslint-disable-next-line @typescript-eslint/ban-ts-comment
        componentSnapshot.dashboardInfo.id = dashboardInfo.value.id
        // @ts-expect-error eslint-disable-next-line @typescript-eslint/ban-ts-comment
        componentSnapshot.dashboardInfo.pid = dashboardInfo.value.pid
        // @ts-expect-error eslint-disable-next-line @typescript-eslint/ban-ts-comment
        componentSnapshot.dashboardInfo.dataState = dashboardInfo.value.dataState
        // @ts-expect-error eslint-disable-next-line @typescript-eslint/ban-ts-comment
        componentSnapshot.dashboardInfo.contentId = dashboardInfo.value.contentId
        this.snapshotPublish(componentSnapshot)
        this.styleChangeTimes++
        this.snapshotDisableTime = Date.now() + 3000
        dashboardStore.setCurComponent(null)
      }
    },

    redo() {
      if (this.snapshotIndex < this.snapshotData.length - 1) {
        this.snapshotIndex++
        const snapshotInfo = _.cloneDeep(this.snapshotData[this.snapshotIndex])
        // @ts-expect-error eslint-disable-next-line @typescript-eslint/ban-ts-comment
        snapshotInfo.dashboardInfo.id = dashboardInfo.value.id
        // @ts-expect-error eslint-disable-next-line @typescript-eslint/ban-ts-comment
        snapshotInfo.dashboardInfo.pid = dashboardInfo.value.pid
        // @ts-expect-error eslint-disable-next-line @typescript-eslint/ban-ts-comment
        snapshotInfo.dashboardInfo.dataState = dashboardInfo.value.dataState
        // @ts-expect-error eslint-disable-next-line @typescript-eslint/ban-ts-comment
        snapshotInfo.dashboardInfo.contentId = dashboardInfo.value.contentId
        this.snapshotPublish(snapshotInfo)
        this.styleChangeTimes++
        this.snapshotDisableTime = Date.now() + 3000
        dashboardStore.setCurComponent(null)
      }
    },
    snapshotPublish(snapshotInfo: any) {
      dashboardStore.updateDashboardInfo(snapshotInfo.dashboardInfo)
      dashboardStore.setComponentData(snapshotInfo.componentData)
      dashboardStore.setCanvasStyleData(snapshotInfo.canvasStyleData)
      dashboardStore.setCanvasViewInfo(snapshotInfo.canvasViewInfo)
    },

    resetStyleChangeTimes() {
      this.styleChangeTimes = 0
      this.snapshotCacheTimes = 0
    },
    resetSnapshot() {
      this.styleChangeTimes = -1
      this.cacheStyleChangeTimes = 0
      this.snapshotCacheTimes = 0
      this.snapshotData = []
      this.snapshotIndex = -1
      this.recordSnapshot()
    },

    recordSnapshot() {
      if (dataPrepareState.value) {
        this.styleChangeTimes = ++this.styleChangeTimes
        // Add a new snapshot
        // @ts-expect-error eslint-disable-next-line @typescript-eslint/ban-ts-comment
        this.snapshotData[++this.snapshotIndex] = {
          componentData: _.cloneDeep(componentData.value),
          canvasStyleData: _.cloneDeep(canvasStyleData.value),
          canvasViewInfo: _.cloneDeep(canvasViewInfo.value),
          dashboardInfo: _.cloneDeep(dashboardInfo.value),
        }
        // During the undo process, when adding a new snapshot, the snapshots following it should be cleaned up
        if (this.snapshotIndex < this.snapshotData.length - 1) {
          this.snapshotData = this.snapshotData.slice(0, this.snapshotIndex + 1)
        }
        // Clean up cache counters
        this.snapshotCacheTimes = 0
      }
    },
  },
})

export function setDefaultComponentData(data = []) {
  defaultCanvasInfo.componentData = data
}

function getDefaultCanvasInfo() {
  return defaultCanvasInfo
}

export function setDefaultCanvasInfo(data: any) {
  defaultCanvasInfo = data
}

export const snapshotStoreWithOut = () => {
  return snapshotStore(store)
}
