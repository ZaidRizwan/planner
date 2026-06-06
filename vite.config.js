import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

// Plugin to copy widget.html into dist after build
function copyWidget() {
  return {
    name: 'copy-widget',
    closeBundle() {
      try {
        mkdirSync('dist', { recursive: true })
        copyFileSync('public/widget.html', 'dist/widget.html')
        console.log('✓ widget.html copied to dist/')
      } catch (e) {
        console.warn('Could not copy widget.html:', e.message)
      }
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), copyWidget()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
