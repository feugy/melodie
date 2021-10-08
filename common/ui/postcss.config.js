'use strict'

module.exports = {
  plugins: [
    require('postcss-import'),
    require('tailwindcss'),
    require('postcss-nesting'),
    require('postcss-preset-evergreen') // postcss-preset-env')({ stage: 1 })
  ]
}
