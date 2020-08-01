'use strict'

exports.sleep = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms))
