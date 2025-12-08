import { ref } from 'vue'

export function useChatInput() {
  const userInput = ref('')
  const textareaRef = ref<HTMLTextAreaElement>()
  const isComposing = ref(false)

  const adjustTextareaHeight = () => {
  }

  const handleCompositionStart = () => {
    isComposing.value = true
  }

  const handleCompositionEnd = () => {
    isComposing.value = false
  }

  const handleKeydown = (event: KeyboardEvent, onSend: () => void) => {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        return
      } else {
        if (isComposing.value) {
          return
        }
        event.preventDefault()
        onSend()
      }
    }
  }

  const clearInput = () => {
    userInput.value = ''
    const textarea = textareaRef.value
    if (textarea) {
      textarea.style.height = '80px'
    }
  }

  return {
    userInput,
    textareaRef,
    isComposing,
    adjustTextareaHeight,
    handleCompositionStart,
    handleCompositionEnd,
    handleKeydown,
    clearInput
  }
}
