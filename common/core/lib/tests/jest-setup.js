'use strict'

const { join } = require('path')
const { tmpdir } = require('os')

process.env.LOG_LEVEL_FILE = '.levels'
process.env.LOG_DESTINATION = 'logs.txt'
process.env.ARTWORK_DESTINATION = join(tmpdir(), 'melodie-media-tests')
