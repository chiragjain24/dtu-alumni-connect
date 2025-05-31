import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@backend": path.resolve(__dirname, "../backend"),
    },
  },
  preview: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      external: (id) => {
        // Exclude any backend imports from the bundle
        return id.includes('../backend') || id.includes('@backend')
      }
    }
  }
})
