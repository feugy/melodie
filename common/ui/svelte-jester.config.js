const sveltePreprocess = require('svelte-preprocess')
const { windi } = require('svelte-windicss-preprocess')

module.exports = {
  preprocess: [
    sveltePreprocess({
      postcss: true,
      replace: [
        [
          // Workaround to replace regexparam import by require, otherwise default import doesn't run with Jest.
          // caution, this must not be applied on dev and production builds
          // https://github.com/ItalyPaleAle/svelte-spa-router/issues/81
          "import regexparam from 'regexparam'",
          "const regexparam = require('regexparam')"
        ]
      ]
    }),
    // Jest does not use vite, which has its windiCSS processor
    windi({})
  ]
}
