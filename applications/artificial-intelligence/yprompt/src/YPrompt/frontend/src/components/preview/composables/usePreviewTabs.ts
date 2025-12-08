import { ref, nextTick } from 'vue'

export type TabType = 'report' | 'thinking' | 'initial' | 'advice' | 'zh' | 'en'

export interface TabRefs {
  tabContainer?: HTMLElement
  reportTab?: HTMLButtonElement
  thinkingTab?: HTMLButtonElement
  initialTab?: HTMLButtonElement
  adviceTab?: HTMLButtonElement
  zhTab?: HTMLButtonElement
}

export function usePreviewTabs() {
  const activeTab = ref<TabType>('report')
  const newContentTabs = ref<Set<string>>(new Set())
  const tabRefs = ref<TabRefs>({})

  // 设置标签页引用（合并而非覆盖）
  const setTabRefs = (refs: TabRefs) => {
    tabRefs.value = { ...tabRefs.value, ...refs }
  }

  // 标记选项卡为已查看
  const markTabAsViewed = (tab: string) => {
    newContentTabs.value.delete(tab)
  }

  // 自动滚动到激活的标签页
  const scrollToActiveTab = (tabName: string) => {
    const tabRefMap = {
      'report': tabRefs.value.reportTab,
      'thinking': tabRefs.value.thinkingTab,
      'initial': tabRefs.value.initialTab,
      'advice': tabRefs.value.adviceTab,
      'zh': tabRefs.value.zhTab
    }

    const targetTab = tabRefMap[tabName as keyof typeof tabRefMap]
    const container = tabRefs.value.tabContainer

    if (targetTab && container) {
      const containerRect = container.getBoundingClientRect()
      const tabRect = targetTab.getBoundingClientRect()

      // 计算标签页相对于容器的位置
      const tabLeftRelativeToContainer = tabRect.left - containerRect.left + container.scrollLeft
      const tabRightRelativeToContainer = tabLeftRelativeToContainer + tabRect.width

      // 检查标签页是否在可视区域内
      const containerWidth = containerRect.width
      const scrollLeft = container.scrollLeft
      const scrollRight = scrollLeft + containerWidth

      // 如果标签页不在可视区域内，则滚动到合适位置
      if (tabLeftRelativeToContainer < scrollLeft) {
        // 标签页在左侧不可见，滚动到标签页开始位置
        container.scrollTo({
          left: tabLeftRelativeToContainer - 20, // 留一点边距
          behavior: 'smooth'
        })
      } else if (tabRightRelativeToContainer > scrollRight) {
        // 标签页在右侧不可见，滚动使标签页完全可见
        container.scrollTo({
          left: tabLeftRelativeToContainer - containerWidth + tabRect.width + 20, // 留一点边距
          behavior: 'smooth'
        })
      }
    }
  }

  // 自动切换标签页并滚动（用于流式更新时）
  const switchToTabWithScroll = (tab: string) => {
    activeTab.value = tab as TabType
    nextTick(() => {
      scrollToActiveTab(tab)
    })
  }

  // 处理标签页切换
  const handleTabChange = (tab: string) => {
    activeTab.value = tab as TabType
    markTabAsViewed(tab)
    // 滚动到目标标签页
    nextTick(() => {
      scrollToActiveTab(tab)
    })
  }

  return {
    activeTab,
    newContentTabs,
    setTabRefs,
    markTabAsViewed,
    scrollToActiveTab,
    switchToTabWithScroll,
    handleTabChange
  }
}
