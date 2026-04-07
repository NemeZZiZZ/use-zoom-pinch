import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "node:path"

export default defineConfig({
  plugins: [react()],
  base: "/use-zoom-pinch/",
  resolve: {
    alias: {
      "use-zoom-pinch": path.resolve(__dirname, "../src"),
      react: path.resolve(__dirname, "node_modules/react"),
    },
  },
})
