'use strict'

// https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_uniq
exports.uniq = array => [...new Set(array)]

// https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_difference
exports.difference = (...arrays) =>
  arrays.reduce((result, filtered) =>
    result.filter(item => !filtered.includes(item))
  )
