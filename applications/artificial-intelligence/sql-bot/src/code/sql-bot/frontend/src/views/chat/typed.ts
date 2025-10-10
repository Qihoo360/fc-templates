import { computed, onWatcherCleanup, unref, watch, ref } from 'vue'
import type { Ref, VNode } from 'vue'

function isString(str: any): str is string {
  return typeof str === 'string'
}

function useState<T, R = Ref<T>>(defaultStateValue?: T | (() => T)): [R, (val: T) => void] {
  const initValue: T =
    typeof defaultStateValue === 'function' ? (defaultStateValue as any)() : defaultStateValue

  const innerValue = ref(initValue) as Ref<T>

  function triggerChange(newValue: T) {
    innerValue.value = newValue
  }

  return [innerValue as unknown as R, triggerChange]
}
/**
 * Return typed content and typing status when typing is enabled.
 * Or return content directly.
 */
const useTypedEffect = (
  content: Ref<VNode | object | string>,
  typingEnabled: Ref<boolean>,
  typingStep: Ref<number>,
  typingInterval: Ref<number>
): [typedContent: Ref<VNode | object | string>, isTyping: Ref<boolean>] => {
  const [prevContent, setPrevContent] = useState<VNode | object | string>('')
  const [typingIndex, setTypingIndex] = useState<number>(1)

  const mergedTypingEnabled = computed(() => typingEnabled.value && isString(content.value))

  // Reset typing index when content changed
  watch(content, () => {
    const prevContentValue = unref(prevContent)
    setPrevContent(content.value)
    if (!mergedTypingEnabled.value && isString(content.value)) {
      setTypingIndex(content.value.length)
    } else if (
      isString(content.value) &&
      isString(prevContentValue) &&
      content.value.indexOf(prevContentValue) !== 0
    ) {
      setTypingIndex(1)
    }
  })

  // Start typing
  watch(
    [typingIndex, typingEnabled, content],
    () => {
      if (
        mergedTypingEnabled.value &&
        isString(content.value) &&
        unref(typingIndex) < content.value.length
      ) {
        const id = setTimeout(() => {
          setTypingIndex(unref(typingIndex) + typingStep.value)
        }, typingInterval.value)

        onWatcherCleanup(() => {
          clearTimeout(id)
        })
      }
    },
    { immediate: true }
  )

  const mergedTypingContent = computed(() =>
    mergedTypingEnabled.value && isString(content.value)
      ? content.value.slice(0, unref(typingIndex))
      : content.value
  )

  return [
    mergedTypingContent,
    computed(
      () =>
        mergedTypingEnabled.value &&
        isString(content.value) &&
        unref(typingIndex) < content.value.length
    ),
  ]
}

export default useTypedEffect
