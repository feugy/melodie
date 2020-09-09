'use strict'

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
    postcssRule.use.push({
      loader: require.resolve('string-replace-loader'),
      options: {
        // only viable way to have local data imported in css in storybook AND electron
        search: /url\(\.\/fonts/g,
        replace: 'url(../public/fonts'
      }
    })

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
