'use strict'

const sveltePreprocess = require('svelte-preprocess')
const { version } = require('./package.json')

const production = !process.env.ROLLUP_WATCH

module.exports = {
  preprocess: sveltePreprocess({
    postcss: {
      configFilePath: require.resolve('@melodie/ui/postcss.config')
    },
    replace: [['MELODIE_VERSION', JSON.stringify(version)]]
  }),
  // enable run-time checks when not in production
  dev: !production
}
