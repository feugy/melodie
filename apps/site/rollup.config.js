'use strict'

import path from 'path'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import url from '@rollup/plugin-url'
import yaml from '@rollup/plugin-yaml'
import svelte from 'rollup-plugin-svelte'
import { terser } from 'rollup-plugin-terser'
import config from 'sapper/config/rollup.js'
import { version } from './package.json'

const mode = process.env.NODE_ENV
const dev = mode === 'development'

const onwarn = (warning, onwarn) =>
  (warning.code === 'MISSING_EXPORT' && /'preload'/.test(warning.message)) ||
  (warning.code === 'CIRCULAR_DEPENDENCY' &&
    /[/\\]@sapper[/\\]/.test(warning.message)) ||
  onwarn(warning)

const urlConf = {
  sourceDir: path.resolve(__dirname, 'src/node_modules/images'),
  publicPath: '/client/'
}
const resolveConf = { dedupe: ['svelte'] }
const replaceConf = {
  preventAssignment: true,
  values: {
    'process.browser': true,
    'process.env.NODE_ENV': JSON.stringify(mode),
    MELODIE_VERSION: JSON.stringify(version)
  }
}
const svelteConf = require('./svelte.config')

export default {
  client: {
    input: config.client.input(),
    output: config.client.output(),
    plugins: [
      replace(replaceConf),

      svelte({
        ...svelteConf,
        compilerOptions: {
          ...svelteConf.compilerOptions,
          dev,
          hydratable: true
        }
      }),

      url(urlConf),

      resolve({ ...resolveConf, browser: true }),

      commonjs(),

      yaml(),

      !dev && terser({ module: true })
    ],

    preserveEntrySignatures: false,
    onwarn
  },

  server: {
    input: config.server.input(),
    output: config.server.output(),
    plugins: [
      replace(replaceConf),

      svelte({
        ...svelteConf,
        emitCss: false,
        compilerOptions: {
          ...svelteConf.compilerOptions,
          generate: 'ssr',
          hydratable: false,
          dev
        }
      }),

      url({ ...urlConf, emitFiles: false }),

      resolve(resolveConf),

      commonjs(),

      yaml()
    ],
    external: [
      'sapper',
      'fastify',
      'fastify-static',
      ...require('module').builtinModules
    ],

    preserveEntrySignatures: 'strict',
    onwarn
  }
}
