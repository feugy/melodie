'use strict'

import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import yaml from '@rollup/plugin-yaml'
import svelte from 'rollup-plugin-svelte'
import livereload from 'rollup-plugin-livereload'
import { terser } from 'rollup-plugin-terser'
import postcss from 'rollup-plugin-postcss'
import replace from '@rollup/plugin-replace'
import { config } from 'dotenv'
const { dependencies } = require('./package-lock')
const svelteConfig = require('./svelte.config')

config()
const production = !process.env.ROLLUP_WATCH

export default {
  input: 'renderer/index.js',
  output: {
    sourcemap: true,
    format: 'iife',
    name: 'app',
    file: 'public/build/bundle.js'
  },
  plugins: [
    replace({
      RXJS_VERSION: JSON.stringify(dependencies.rxjs.version),
      TAILWINDCSS_VERSION: JSON.stringify(dependencies.rxjs.version)
    }),

    svelte(svelteConfig),

    postcss({
      config: {
        path: './postcss.config.js'
      }
    }),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration -
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      dedupe: ['svelte']
    }),
    commonjs(),

    yaml(),

    // In dev mode, call `npm run start` once
    // the bundle has been generated
    !production && serve(),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload('public'),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser()
  ],
  watch: {
    clearScreen: true
  }
}

function serve() {
  let started = false

  return {
    writeBundle() {
      if (!started) {
        started = true

        require('child_process')
          .spawn('npm', ['run', 'start'], {
            stdio: ['ignore', 'inherit', 'inherit'],
            shell: true
          })
          .on('exit', () => {
            started = false
          })
      }
    }
  }
}
