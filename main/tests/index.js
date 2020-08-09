'use strict'

module.exports = {
  ...require('./nocks'),
  ...require('./files'),
  sleep: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms))
}
