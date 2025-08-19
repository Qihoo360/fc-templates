import type { DefineComponent } from 'vue'

declare module 'vue' {
  export interface GlobalComponents {
    [key: string]: DefineComponent<{}, {}, any>
  }
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
} 