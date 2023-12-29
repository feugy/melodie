import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./lib/tests/test-setup.js'],
    coverage: {
      exclude: [
        'coverage/**',
        'dist/**',
        'node_modules/**',
        'out/**',
        '**/tests/**',
        '**/*{.,-}{test,spec}.?(c|m)[jt]s?(x)',
        'electron.vite.config.?(c|m)[jt]s?(x)'
      ]
    }
  }
})
