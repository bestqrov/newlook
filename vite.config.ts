import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    // Local dev: forward API + uploaded images to the Express server (server/).
    proxy: {
      "/api": { target: "http://localhost:4000", changeOrigin: false },
      "/uploads": { target: "http://localhost:4000", changeOrigin: false },
    },
  },
})
