import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    setupFiles: ['./lib/tests/test-setup.js']
  }
})
