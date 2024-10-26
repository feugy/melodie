import * as matchers from 'jest-extended'
import { tmpdir } from 'os'
import { join } from 'path'
import { expect } from 'vitest'

expect.extend(matchers)

// disable pino@7 auto end for transports as it break on latest vi runner (vi-circus)
// ReferenceError: You are trying to `import` a file after the vi environment has been torn down.
//     at setupOnExit (../node_modules/pino/lib/transport.js:13:20)
// global.FinalizationRegistry = false

process.env.LOG_LEVEL_FILE = '.levels'
process.env.LOG_DESTINATION = 'logs.txt'
process.env.ARTWORK_DESTINATION = join(tmpdir(), 'melodie-media-tests')
