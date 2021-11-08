const sveltePreprocess = require('svelte-preprocess')
const { windi } = require('svelte-windicss-preprocess')

// This file is ONLY used by VSCode when parsing Svelte files to provide Intellisense.
module.exports = {
  preprocess: [sveltePreprocess({ postcss: true }), windi({})]
}
