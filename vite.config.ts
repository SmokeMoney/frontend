import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api/0x': {
        target: 'https://api.0x.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/0x/, '')
      }
    }
  }
})