import atelier from '@atelier-wb/vite-plugin-atelier'
import yaml from '@rollup/plugin-yaml'
import adapter from '@sveltejs/adapter-static'
import { createRequire } from 'module'
import { join } from 'path'
import sveltePreprocess from 'svelte-preprocess'
import windi from 'vite-plugin-windicss'

const require = createRequire(import.meta.url)
const { version } = require('./package.json')

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
    paths: { base },
    adapter: adapter({
      fallback: 'index.html'
    }),
    vite: {
      plugins: [
        yaml(),
        windi(),
        atelier({
          url: '/atelier/',
          path: join('.', 'src'),
          setupPath: './atelier/setup.js',
          publicDir: ['static', join('..', '..', 'common', 'ui', 'public')]
        })
      ]
    }
  }
}
