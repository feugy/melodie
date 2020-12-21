'use strict'

module.exports = {
  sleep: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms))
}
