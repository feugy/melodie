import atelier from '@atelier-wb/vite-plugin-svelte'
import yaml from '@rollup/plugin-yaml'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { createRequire } from 'module'
import { join, resolve } from 'path'
import windi from 'vite-plugin-windicss'
import { defineConfig } from 'vite'

const require = createRequire(import.meta.url)
const { dependencies } = require('../../package-lock.json')

export default defineConfig(({ command, mode }) => {
  const isAtelier = command === 'serve' && mode === 'test'
  return {
    build: command === 'serve' && { watch: {} },
    server: { open: isAtelier },
    define: {
      RXJS_VERSION: JSON.stringify(dependencies.rxjs.version),
      WINDICSS_VERSION: JSON.stringify(dependencies.windicss.version),
      'process.env.NODE_ENV': JSON.stringify(mode)
    },
    plugins: [
      yaml(),
      windi(),
      svelte(),
      isAtelier &&
        atelier({
          url: '/',
          path: resolve(__dirname, 'src'),
          setupPath: resolve(__dirname, 'src', 'atelier', 'setup'),
          publicDir: join('..', 'fixtures')
        })
    ]
  }
})
