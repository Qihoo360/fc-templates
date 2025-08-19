import { ref, watch, nextTick, type Ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * useAutoScroll 组合式函数
 * -------------------------
 * 提供智能自动滚动功能，当用户向上滚动时会暂停自动滚动，滚动到底部后恢复自动滚动。
 * 
 * 使用方法:
 * 
 * 1. 基本用法
 * ```typescript
 * const { elementRef } = useAutoScroll<HTMLDivElement>()
 * // 在模板中引用元素
 * // <div ref="elementRef">...</div>
 * ```
 * 
 * 2. 适用于整块内容更新的场景（如PromptPanel）
 * ```typescript
 * const { elementRef: textareaRef, watchSource } = useAutoScroll<HTMLTextAreaElement>()
 * // 监听props变化并触发滚动
 * watchSource(() => props.content, true)
 * ```
 * 
 * 3. 适用于流式内容更新的场景（如OutputPanel）
 * ```typescript
 * const { elementRef: containerRef, onContentChange } = useAutoScroll<HTMLDivElement>()
 * 
 * // 当内容更新时通知滚动系统
 * const updateContent = (text: string) => {
 *   content.value += text
 *   onContentChange()
 * }
 * ```
 * 
 * 4. 强制滚动（无论用户是否手动滚动）
 * ```typescript
 * const { elementRef, forceScrollToBottom } = useAutoScroll<HTMLElement>()
 * 
 * // 在需要时强制滚动到底部
 * const resetView = () => {
 *   forceScrollToBottom()
 * }
 * ```
 * 
 * 5. 获取和控制自动滚动状态
 * ```typescript
 * const { elementRef, shouldAutoScroll } = useAutoScroll<HTMLElement>()
 * 
 * // 监听自动滚动状态
 * watch(shouldAutoScroll, (enabled) => {
 *   console.log(`Auto-scroll is now ${enabled ? 'enabled' : 'disabled'}`)
 * })
 * 
 * // 手动切换自动滚动状态
 * const toggleAutoScroll = () => {
 *   shouldAutoScroll.value = !shouldAutoScroll.value
 * }
 * ```
 * 
 * @param options 配置选项
 * @returns 包含元素ref和自动滚动相关方法的对象
 */
export function useAutoScroll<T extends HTMLElement>(options: {
    /**
     * 是否启用自动滚动
     * @default true
     */
    enabled?: boolean;
    /**
     * 在日志中输出调试信息
     * @default false
     */
    debug?: boolean;
    /**
     * 检测滚动到底部的阈值（像素）
     * @default 10
     */
    threshold?: number;
} = {}): {
    elementRef: Ref<T | null>;
    scrollToBottom: () => Promise<void>;
    watchSource: <S>(source: Ref<S> | (() => S),
        immediate?: boolean) => void; forceScrollToBottom: () => Promise<void>;
    shouldAutoScroll: Ref<boolean>
    onContentChange: () => void
} {
    const {
        enabled = true,
        debug = false,
        threshold = 10
    } = options

    // 创建要滚动元素的引用
    const elementRef = ref<T | null>(null) as Ref<T | null>

    // 是否应该自动滚动（当用户手动向上滚动时会设置为false）
    const shouldAutoScroll = ref(true)

    /**
     * 检查元素是否已经滚动到底部
     */
    const isScrolledToBottom = (element: HTMLElement): boolean => {
        // 元素的完整滚动高度 - 元素当前滚动位置 - 元素可见高度 <= 阈值
        return element.scrollHeight - element.scrollTop - element.clientHeight <= threshold
    }

    /**
     * 处理滚动事件
     */
    const handleScroll = () => {
        if (!elementRef.value) return

        // 检查是否滚动到底部
        const isBottom = isScrolledToBottom(elementRef.value)

        if (isBottom && !shouldAutoScroll.value) {
            if (debug) {
                console.log('User scrolled to bottom, resuming auto-scroll')
            }
            shouldAutoScroll.value = true
        } else if (!isBottom && shouldAutoScroll.value) {
            if (debug) {
                console.log('User scrolled up, pausing auto-scroll')
            }
            shouldAutoScroll.value = false
        }
    }

    // 添加和移除滚动事件监听器
    onMounted(() => {
        if (elementRef.value) {
            elementRef.value.addEventListener('scroll', handleScroll)
        }
    })

    // 监听元素引用的变化，以便添加事件处理程序
    watch(elementRef, (newEl, oldEl) => {
        if (oldEl) {
            oldEl.removeEventListener('scroll', handleScroll)
        }
        if (newEl) {
            newEl.addEventListener('scroll', handleScroll)
        }
    })

    onBeforeUnmount(() => {
        if (elementRef.value) {
            elementRef.value.removeEventListener('scroll', handleScroll)
        }
    })

    /**
     * 手动触发滚动到底部
     */
    const scrollToBottom = async () => {
        if (!enabled || !elementRef.value || !shouldAutoScroll.value) return

        await nextTick()
        const element = elementRef.value

        if (element) {
            if (debug) {
                console.log('Scrolling element to bottom:', {
                    scrollHeight: element.scrollHeight,
                    element
                })
            }

            element.scrollTop = element.scrollHeight
        }
    }

    /**
     * 强制滚动到底部，无论shouldAutoScroll状态如何
     */
    const forceScrollToBottom = async () => {
        if (!enabled || !elementRef.value) return

        await nextTick()
        const element = elementRef.value

        if (element) {
            if (debug) {
                console.log('Force scrolling element to bottom')
            }

            element.scrollTop = element.scrollHeight
            shouldAutoScroll.value = true
        }
    }

    // 添加内部容器高度状态
    const containerHeight = ref(0)

    // 检查高度变化的函数
    const checkHeightChange = () => {
        if (elementRef.value) {
            const newHeight = elementRef.value.scrollHeight
            if (newHeight !== containerHeight.value) {
                containerHeight.value = newHeight
                // 只有当应该自动滚动时才滚动
                scrollToBottom()
            }
        }
    }

    // 提供一个函数用于内容变化时检查高度
    const onContentChange = () => {
        nextTick(checkHeightChange)
    }

    /**
     * 设置监听源头的自动滚动
     * @param source 需要监听变化的源数据
     * @param immediate 是否立即执行
     */
    const watchSource = <S>(source: Ref<S> | (() => S), immediate = false) => {
        watch(source, () => {
            if (debug) {
                console.log('Source changed, triggering scroll, shouldAutoScroll:', shouldAutoScroll.value)
            }

            scrollToBottom()
        }, { immediate })

        return { elementRef, scrollToBottom, forceScrollToBottom, shouldAutoScroll }
    }

    return {
        elementRef,
        scrollToBottom,
        forceScrollToBottom,
        watchSource,
        shouldAutoScroll,
        onContentChange
    }
}