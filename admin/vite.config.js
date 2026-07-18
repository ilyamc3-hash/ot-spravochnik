import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Local-only admin tool: never deployed, so no `base` needed.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
  },
})
