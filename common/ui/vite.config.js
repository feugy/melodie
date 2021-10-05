import atelier from '@atelier-wb/vite-plugin-svelte'
import yaml from '@rollup/plugin-yaml'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { join, resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  server: { open: true },
  plugins: [
    svelte(),
    yaml(),
    atelier({
      url: '/',
      path: resolve(__dirname, 'src'),
      setupPath: resolve(__dirname, 'src', 'atelier', 'setup'),
      publicDir: join('..', 'fixtures')
    })
  ]
})
