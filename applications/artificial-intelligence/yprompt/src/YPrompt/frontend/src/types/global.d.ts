export {}

declare global {
  interface Window {
    marked?: {
      parse: (input: string, options?: any) => string
    }
    hljs?: {
      highlightElement: (el: HTMLElement) => void
      registerLanguage: (name: string, language: any) => void
    }
    lucide?: {
      createIcons: () => void
    }
  }
}

