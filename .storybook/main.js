'use strict'

const { preprocess } = require('../svelte.config')

module.exports = {
  stories: ['../renderer/**/*.stories.js'],
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

    config.module.rules.push({
      test: /\.ya?ml$/,
      type: 'json',
      use: 'yaml-loader'
    })

    config.externals = {
      electron: 'electron'
    }
    return config
  }
}
