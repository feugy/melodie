'use strict'

const { resolve } = require('path')

module.exports = {
  stories: ['../renderer/**/*.stories.js'],
  addons: ['@storybook/addon-actions', '@storybook/addon-links'],
  webpackFinal: config => {
    const svelteRule = config.module.rules.find(
      ({ loader }) => loader && loader.includes('svelte-loader')
    )
    svelteRule.options = {
      ...svelteRule.options,
      emitCss: true,
      hotReload: false
    }

    config.module.rules.push(
      {
        test: /\.css$/,
        use: [
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true,
              config: {
                path: resolve(__dirname, '..', 'postcss.config.js')
              }
            }
          }
        ]
      },
      {
        test: /\.ya?ml$/,
        type: 'json',
        use: 'yaml-loader'
      }
    )

    config.externals = {
      electron: 'electron'
    }

    return config
  }
}
