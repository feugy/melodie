'use strict'

const { preprocess } = require('../../svelte.config')

module.exports = {
  stories: ['../src/**/*.stories.js'],
  addons: ['@storybook/addon-actions', '@storybook/addon-knobs'],
  webpackFinal: config => {
    const svelteRule = config.module.rules.find(
      ({ loader }) => loader && loader.includes('svelte-loader')
    )
    svelteRule.options = {
      ...svelteRule.options,
      emitCss: true,
      hotReload: false,
      preprocess
    }

    const cssRule = config.module.rules.find(
      ({ use }) =>
        Array.isArray(use) &&
        use.some(
          loader =>
            typeof loader === 'string' && loader.includes('style-loader')
        )
    )

    cssRule.use[1].options.url = url => {
      return url.startsWith('../images') ? false : true
    }

    config.module.rules.push({
      test: /\.ya?ml$/,
      type: 'json',
      use: 'yaml-loader'
    })
    return config
  }
}
