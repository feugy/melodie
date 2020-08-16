'use strict'

module.exports = {
  stories: ['../renderer/**/*.stories.js'],
  addons: ['@storybook/addon-actions'],
  webpackFinal: config => {
    const svelteRule = config.module.rules.find(
      ({ loader }) => loader && loader.includes('svelte-loader')
    )
    svelteRule.options = {
      ...svelteRule.options,
      emitCss: true,
      hotReload: false
    }

    const postcssRule = config.module.rules.find(
      ({ use }) =>
        use &&
        use.find(
          plugin => plugin.loader && plugin.loader.includes('postcss-loader')
        )
    )
    postcssRule.test = /\.p?css$/

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
