/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Vite 已经通过 /// <reference types="vite/client" /> 提供了内置的环境变量类型

// 引入 Electron 类型定义
/// <reference path="./src/types/electron.d.ts" />