import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { rmSync } from 'fs'

// 清理输出目录
rmSync('dist', { recursive: true, force: true })

// https://vite.dev/config/
export default defineConfig({
  // 修复GitHub Pages子路径白屏！必须和你的仓库名完全一致
  base: '/my-3d-app/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // 为所有资源文件添加哈希值
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
})