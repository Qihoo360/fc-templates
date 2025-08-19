interface ExtendedHTMLElement extends HTMLElement {
  _clickOutside?: (event: Event) => void
}

export const clickOutside = {
  mounted(el: ExtendedHTMLElement, binding: { value: () => void }) {
    el._clickOutside = (event: Event) => {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value()
      }
    }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el: ExtendedHTMLElement) {
    if (el._clickOutside) {
      document.removeEventListener('click', el._clickOutside)
    }
  }
} 