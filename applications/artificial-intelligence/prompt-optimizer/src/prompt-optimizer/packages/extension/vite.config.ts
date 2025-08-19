import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), basicSsl()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@prompt-optimizer/ui': resolve(__dirname, '../ui')
    },
  },
  base: './',  // 使用相对路径
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html')
      },
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'background.js') {
            return 'background.js';
          }
          return `assets/[name].[ext]`;
        }
      }
    },
    copyPublicDir: true
  },
  server: {
    port: 5174,
    https: {}
  }
}) 