import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import fs from 'fs'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      vue: 'vue/dist/vue.esm-bundler.js'
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        secure: false
      }
    }
  },
  define: {
    // 支持从配置文件加载内置提供商
    __BUILTIN_PROVIDERS__: JSON.stringify(getBuiltinProviders())
  }
})

// 获取内置提供商配置
function getBuiltinProviders() {
  try {
    // 尝试从根目录的 builtin-providers.json 文件读取配置
    const configPath = resolve(__dirname, 'builtin-providers.json')
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf-8')
      const config = JSON.parse(configContent)
      return config
    }
  } catch (error) {
    console.warn('⚠️ 读取内置提供商配置失败:', error.message)
  }
  
  // 如果没有配置文件或读取失败，返回空数组
  return []
}
