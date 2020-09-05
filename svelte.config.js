'use strict'

const autoPreprocess = require('svelte-preprocess')

const production = !process.env.ROLLUP_WATCH

module.exports = {
  preprocess: autoPreprocess({
    postcss: true,
    replace: [
      [
        // Workaround to replace regexparam import by require, otherwise default import doesn't run with Jest.
        // https://github.com/ItalyPaleAle/svelte-spa-router/issues/81
        "import regexparam from 'regexparam'",
        "const regexparam = require('regexparam')"
      ]
    ]
  }),
  // enable run-time checks when not in production
  dev: !production,
  // we'll extract any component CSS out into
  // a separate file - better for performance
  css: css => {
    css.write('public/build/bundle.css')
  }
}
