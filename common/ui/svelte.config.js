'use strict'

const sveltePreprocess = require('svelte-preprocess')

const production = !process.env.ROLLUP_WATCH

module.exports = {
  preprocess: sveltePreprocess({ postcss: true }),
  // enable run-time checks when not in production
  dev: !production,
  // we'll extract any component CSS out into
  // a separate file - better for performance
  css: css => {
    css.write('bundle.css')
  }
}
