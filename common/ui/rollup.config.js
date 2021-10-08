'use strict'

import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import yaml from '@rollup/plugin-yaml'
import postcss from 'rollup-plugin-postcss'
import svelte from 'rollup-plugin-svelte'
import { terser } from 'rollup-plugin-terser'
const { dependencies } = require('../../package-lock')
const svelteConfig = require('./svelte.config')

const production = !process.env.ROLLUP_WATCH

export default {
  input: 'src/index.js',
  output: {
    sourcemap: true,
    format: 'iife',
    name: 'app',
    file: './public/build/bundle.js'
  },
  plugins: [
    replace({
      preventAssignment: true,
      values: {
        RXJS_VERSION: JSON.stringify(dependencies.rxjs.version),
        TAILWINDCSS_VERSION: JSON.stringify(dependencies.tailwindcss.version),
        'process.env.NODE_ENV': JSON.stringify(
          production ? 'production' : 'dev'
        )
      }
    }),

    svelte(svelteConfig),

    postcss({
      extract: 'bundle.css',
      minimize: production,
      sourceMap: !production
    }),

    resolve({ browser: true, dedupe: ['svelte'], preferBuiltins: false }),

    commonjs(),

    yaml(),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser()
  ],
  watch: {
    clearScreen: true
  }
}
