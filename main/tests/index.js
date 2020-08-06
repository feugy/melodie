'use strict'

module.exports = {
  ...require('./nocks'),
  sleep: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms))
}
