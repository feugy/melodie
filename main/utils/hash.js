'use strict'

const { h32 } = require('xxhashjs')

const hashSeed = 0x123abc

exports.hash = function (str) {
  return h32(str.toLowerCase(), hashSeed).toNumber()
}
