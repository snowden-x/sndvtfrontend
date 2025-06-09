import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '172.20.10.2',
    port: 5173,
    cors: true,
    proxy: {
      '/socket.io': {
        target: 'ws://172.20.10.2:8000',
        changeOrigin: true,
        ws: true,
        secure: false
      }
    }
  }
})