import { ref, nextTick } from 'vue'

export interface ScrollContainerRefs {
  reportScrollContainer?: HTMLElement
  thinkingScrollContainer?: HTMLElement
  initialScrollContainer?: HTMLElement
  adviceScrollContainer?: HTMLElement
  finalScrollContainer?: HTMLElement
}

export function usePreviewScrollSync() {
  const scrollContainerRefs = ref<ScrollContainerRefs>({})
  
  // 设置滚动容器引用
  const setScrollContainerRefs = (refs: ScrollContainerRefs) => {
    scrollContainerRefs.value = refs
  }

  // 滚动到内容底部
  const scrollToBottomOfContent = () => {
    nextTick(() => {
      const containers = [
        scrollContainerRefs.value.reportScrollContainer,
        scrollContainerRefs.value.thinkingScrollContainer,
        scrollContainerRefs.value.initialScrollContainer,
        scrollContainerRefs.value.adviceScrollContainer,
        scrollContainerRefs.value.finalScrollContainer
      ]

      containers.forEach(container => {
        if (container) {
          // 使用 scrollHeight 而不是 scrollTop，确保滚动到真正的底部
          container.scrollTop = container.scrollHeight
        }
      })
    })
  }

  // 滚动特定容器到底部
  const scrollContainerToBottom = (containerName: keyof ScrollContainerRefs) => {
    nextTick(() => {
      const container = scrollContainerRefs.value[containerName]
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    })
  }

  // 滚动特定容器到顶部
  const scrollContainerToTop = (containerName: keyof ScrollContainerRefs) => {
    nextTick(() => {
      const container = scrollContainerRefs.value[containerName]
      if (container) {
        container.scrollTop = 0
      }
    })
  }

  // 平滑滚动到容器底部
  const smoothScrollToBottom = (containerName: keyof ScrollContainerRefs) => {
    nextTick(() => {
      const container = scrollContainerRefs.value[containerName]
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        })
      }
    })
  }

  // 检查容器是否已经滚动到底部
  const isScrolledToBottom = (containerName: keyof ScrollContainerRefs): boolean => {
    const container = scrollContainerRefs.value[containerName]
    if (!container) return false
    
    const threshold = 5 // 允许5px的误差
    return Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < threshold
  }

  // 自动滚动（如果用户没有手动向上滚动）
  const autoScrollIfAtBottom = (containerName: keyof ScrollContainerRefs) => {
    if (isScrolledToBottom(containerName)) {
      scrollContainerToBottom(containerName)
    }
  }

  return {
    setScrollContainerRefs,
    scrollToBottomOfContent,
    scrollContainerToBottom,
    scrollContainerToTop,
    smoothScrollToBottom,
    isScrolledToBottom,
    autoScrollIfAtBottom
  }
}
