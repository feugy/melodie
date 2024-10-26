import { join } from 'node:path'

import atelier from '@atelier-wb/vite-plugin-atelier'
import yaml from '@rollup/plugin-yaml'
import { sveltekit } from '@sveltejs/kit/vite'
import unoCSS from '@unocss/svelte-scoped/vite'
import transformerDirectives from '@unocss/transformer-directives'
import { defineConfig } from 'vite'

import descriptor from './package.json' assert { type: 'json' }

export default defineConfig({
  define: {
    MELODIE_VERSION: JSON.stringify(descriptor.version)
  },
  plugins: [
    yaml(),
    unoCSS({
      injectReset: '@unocss/reset/tailwind.css',
      cssFileTransformers: [transformerDirectives()]
    }),
    sveltekit(),
    atelier({
      path: join('.', 'src'),
      setupPath: './atelier/setup.js',
      publicDir: ['static', join('..', '..', 'common', 'ui', 'public')]
    })
  ],
  test: {
    // https://github.com/vitest-dev/vitest/issues/2834#issuecomment-1439576110
    alias: [{ find: /^svelte$/, replacement: 'svelte/internal' }],
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js']
  }
})
