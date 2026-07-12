import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base: '/ot-spravochnik/' matches the GitHub Pages URL pattern
// https://<username>.github.io/ot-spravochnik/
// Change this if you rename the repository.
export default defineConfig({
  plugins: [react()],
  base: '/ot-spravochnik/',
})
