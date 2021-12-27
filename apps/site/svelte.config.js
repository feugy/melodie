import atelier from '@atelier-wb/vite-plugin-svelte'
import yaml from '@rollup/plugin-yaml'
import adapter from '@sveltejs/adapter-static'
import { createRequire } from 'module'
import { join, resolve } from 'path'
import sveltePreprocess from 'svelte-preprocess'
import { URL } from 'url'
import windi from 'vite-plugin-windicss'

const require = createRequire(import.meta.url)
const { version } = require('./package.json')
const __dirname = new URL('.', import.meta.url).pathname

const base = process.env.NODE_ENV === 'production' ? '/melodie' : ''

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: [
    sveltePreprocess({
      postcss: true,
      replace: [
        ['BASE_URL', JSON.stringify(base ?? '.')],
        ['MELODIE_VERSION', JSON.stringify(version)]
      ]
    })
  ],
  kit: {
    target: '#svelte',
    ssr: false,
    paths: { base },
    adapter: adapter(),
    vite: {
      plugins: [
        yaml(),
        windi(),
        atelier({
          url: '/atelier',
          path: resolve(__dirname, 'src'),
          setupPath: resolve(__dirname, 'src', 'atelier', 'setup'),
          publicDir: ['static', join('..', '..', 'common', 'ui', 'public')]
        })
      ]
    }
  }
}
