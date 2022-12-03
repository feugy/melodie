import atelier from '@atelier-wb/vite-plugin-atelier'
import yaml from '@rollup/plugin-yaml'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { createRequire } from 'module'
import { join } from 'path'
import windi from 'vite-plugin-windicss'
import { defineConfig } from 'vite'

const require = createRequire(import.meta.url)
const { dependencies } = require('../../package-lock.json')

export default defineConfig(({ command, mode }) => {
  const isAtelier = command === 'serve' && mode === 'test'
  return {
    base: '', // needed for usage in production mode within Electron
    build: command === 'serve' && { watch: {} },
    server: { open: false },
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
          path: join('.', 'src'),
          setupPath: './atelier/setup.js',
          publicDir: join('..', 'fixtures')
        })
    ]
  }
})
