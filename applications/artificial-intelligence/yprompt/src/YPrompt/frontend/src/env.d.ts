/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_FEISHU_APP_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 编译时内置提供商配置
declare const __BUILTIN_PROVIDERS__: import('@/config/builtinProviders').BuiltinProviderConfig[]