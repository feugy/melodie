'use strict'

module.exports = {
  ...require('./nocks'),
  ...require('./files'),
  ...require('./refs'),
  sleep: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms))
}
