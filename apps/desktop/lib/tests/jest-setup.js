'use strict'

process.env.LOG_LEVEL_FILE = '.levels'
process.env.LOG_DESTINATION = 'logs.txt'

jest.mock('electron', () => ({
  app: { getPath: jest.fn().mockReturnValue('') }
}))
