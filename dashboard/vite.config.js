import { defineConfig, createLogger } from 'vite'
import react from '@vitejs/plugin-react'

// Filtra os avisos chatos do esbuild/babel no Vite 8
const logger = createLogger()
const originalWarn = logger.warn
logger.warn = (msg, options) => {
  if (msg.includes('vite:react-babel') || msg.includes('deprecated') || msg.includes('optimizeDeps')) return
  originalWarn(msg, options)
}
// Alguns avisos do Vite 8 vazam direto pro console
const originalConsoleWarn = console.warn
console.warn = (...args) => {
  const msg = args.join(' ')
  if (msg.includes('deprecated') || msg.includes('optimizeDeps')) return
  originalConsoleWarn(...args)
}

// https://vitejs.dev/config/
export default defineConfig({
  customLogger: logger,
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true
      }
    }
  }
})
