import { ref, watch, nextTick } from 'vue'

export function useAutoScroll(
  contentGetter: () => any,
  isGeneratingGetter: () => boolean
) {
  const scrollContainerRef = ref<HTMLElement | null>(null)

  const setScrollContainer = (el: HTMLElement | null) => {
    scrollContainerRef.value = el
  }

  const scrollToBottom = () => {
    nextTick(() => {
      if (scrollContainerRef.value) {
        const el = scrollContainerRef.value
        // 对于textarea元素，需要特殊处理
        if (el.tagName === 'TEXTAREA') {
          (el as HTMLTextAreaElement).scrollTop = (el as HTMLTextAreaElement).scrollHeight
        } else {
          el.scrollTop = el.scrollHeight
        }
        
        // 移动端额外处理：强制重新计算滚动位置
        requestAnimationFrame(() => {
          if (scrollContainerRef.value) {
            const element = scrollContainerRef.value
            if (element.tagName === 'TEXTAREA') {
              (element as HTMLTextAreaElement).scrollTop = (element as HTMLTextAreaElement).scrollHeight
            } else {
              element.scrollTop = element.scrollHeight
            }
          }
        })
      }
    })
  }

  watch(
    contentGetter,
    (newVal, oldVal) => {
      // 仅在流式生成且内容真正变化时滚动
      if (isGeneratingGetter() && newVal !== oldVal) {
        scrollToBottom()
      }
    },
    { flush: 'post', deep: true, immediate: false }
  )

  return {
    setScrollContainer,
    scrollToBottom
  }
}
