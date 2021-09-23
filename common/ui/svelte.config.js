'use strict'

const sveltePreprocess = require('svelte-preprocess')

const production = !process.env.ROLLUP_WATCH
const isJest = !!process.env.source && !!process.env.filename

module.exports = {
  preprocess: sveltePreprocess({
    postcss: true,
    replace: isJest
      ? [
          [
            // Workaround to replace regexparam import by require, otherwise default import doesn't run with Jest.
            // caution, this must not be applied on dev and production builds
            // https://github.com/ItalyPaleAle/svelte-spa-router/issues/81
            "import regexparam from 'regexparam'",
            "const regexparam = require('regexparam')"
          ]
        ]
      : []
  }),
  compilerOptions: {
    // enable run-time checks when not in production
    dev: !production,
    css: false
  },
  onwarn(warning, handler) {
    // https://github.com/sveltejs/svelte/issues/5954
    if (warning.code !== 'module-script-reactive-declaration') {
      handler(warning)
    }
  }
}
