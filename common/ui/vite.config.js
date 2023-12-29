import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import atelier from '@atelier-wb/vite-plugin-atelier'
import yaml from '@rollup/plugin-yaml'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import unoCSS from '@unocss/svelte-scoped/vite'
import transformerDirectives from '@unocss/transformer-directives'
import { defineConfig } from 'vite'
import webfontDownload from 'vite-plugin-webfont-dl'

import descriptor from './package.json' assert { type: 'json' }

export default defineConfig(async ({ command, mode }) => {
  const withAtelier = command === 'serve' && mode === 'test'
  return {
    server: { port: 3000 },
    define: {
      RXJS_VERSION: JSON.stringify(descriptor.devDependencies.rxjs),
      UNOCSS_VERSION: JSON.stringify(descriptor.devDependencies.unocss)
    },
    plugins: [
      webfontDownload([
        'https://fonts.bunny.net/css?family=permanent-marker:400|raleway:200,700|source-sans-pro:300,300i,600,600i'
      ]),
      yaml(),
      unoCSS({
        injectReset: '@unocss/reset/tailwind.css',
        // absolute configuration since we'll execute also from apps/desktop
        configOrPath: join(
          dirname(fileURLToPath(import.meta.url)),
          'uno.config.js'
        ),
        cssFileTransformers: [transformerDirectives()]
      }),
      svelte(),
      withAtelier &&
        atelier({
          url: '/',
          path: join('.', 'src'),
          setupPath: './atelier/setup.js',
          publicDir: join('..', 'fixtures')
        })
    ],
    test: {
      // https://github.com/vitest-dev/vitest/issues/2834#issuecomment-1439576110
      alias: [{ find: /^svelte$/, replacement: 'svelte/internal' }],
      environment: 'jsdom', // jsdom does not support CSS nesting yet
      // css: true, // because component tests depends on CSS
      setupFiles: ['./src/tests/test-setup.js']
    }
  }
})
