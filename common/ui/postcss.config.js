'use strict'

module.exports = {
  plugins: {
    'postcss-nesting': {},
    'postcss-url': {
      url: 'copy',
      basePath: '../public',
      assetsPath: '../dist/assets/'
    }
  }
}
