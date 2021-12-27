'use strict'

module.exports = {
  plugins: {
    'postcss-nesting': {},
    'postcss-url': {
      url: process.env.NODE_ENV === 'development' ? 'inline' : 'copy',
      basePath: '../../../common/ui/public',
      assetsPath: '../build'
    }
  }
}
