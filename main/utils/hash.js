'use strict'

const { h32 } = require('xxhashjs')

const hashSeed = 0x123abc

exports.hash = function (str) {
  if (!str) {
    return 0
  }
  return h32(str.toLowerCase().trim(), hashSeed).toNumber()
}
