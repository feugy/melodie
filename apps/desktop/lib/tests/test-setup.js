import * as matchers from 'jest-extended'
import { expect, vi } from 'vitest'

expect.extend(matchers)

process.env.LOG_LEVEL_FILE = '.levels'
process.env.LOG_DESTINATION = 'logs.txt'

vi.mock('electron', () => ({
  app: { getPath: vi.fn().mockReturnValue('') }
}))
