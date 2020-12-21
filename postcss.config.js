'use strict'

// This file is ONLY used by VSCode when parsing Svelte files.
// Despite svelte language tool supporting monorepos, it seems svelte-preprocess
// can not find nested the postcss.config.js files

module.exports = {
  plugins: [
    require('postcss-import'),
    require('tailwindcss'),
    require('postcss-preset-env')({ stage: 1 })
  ]
}
