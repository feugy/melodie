'use strict'

const { join } = require('path')
const { tmpdir } = require('os')

// disable pino@7 auto end for transports as it break on latest jest runner (jest-circus)
// ReferenceError: You are trying to `import` a file after the Jest environment has been torn down.
//     at setupOnExit (../node_modules/pino/lib/transport.js:13:20)
global.FinalizationRegistry = false

process.env.LOG_LEVEL_FILE = '.levels'
process.env.LOG_DESTINATION = 'logs.txt'
process.env.ARTWORK_DESTINATION = join(tmpdir(), 'melodie-media-tests')
