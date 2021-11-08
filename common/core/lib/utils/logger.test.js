'use strict'

const { join } = require('path')
const os = require('os')
const faker = require('faker')
const fs = require('fs-extra')

let pino
let getLogger
let refreshLogLevels

jest.mock('pino')

describe('logger', () => {
  const envSave = Object.assign({}, process.env)
  const levelFile = join(os.tmpdir(), '.levels-test')
  let loggers = {}
  let setters = {}

  function setupLogger(name, proto = {}) {
    loggers[name] = proto
    setters[name] = jest.fn()
    Object.defineProperty(loggers[name], 'level', { set: setters[name] })
    return loggers[name]
  }

  beforeEach(async () => {
    jest.resetModules()
    jest.resetAllMocks()
    process.env = {}
    Object.assign(process.env, envSave)
    process.env.LOG_LEVEL_FILE = levelFile
    await fs.writeFile(levelFile, '')
    loggers = {}
    setters = {}
    pino = require('pino')
    pino.mockReturnValue(
      setupLogger('core', {
        child: jest.fn().mockImplementation(({ name }) => setupLogger(name))
      })
    )
    process.env.LOG_DESTINATION = 1
    ;({ getLogger, refreshLogLevels } = require('./logger'))
  })

  afterEach(async () => {
    try {
      await fs.unlink(levelFile)
    } catch {
      // no error on missing file
    }
  })

  it('returns root logger and cache it', async () => {
    const logger = getLogger()

    expect(logger).toBe(loggers.core)
    expect(pino).toHaveBeenCalledWith({
      name: 'core',
      level: 'silent',
      base: false,
      transport: {
        target: 'pino-pretty',
        options: {
          destination: process.env.LOG_DESTINATION,
          translateTime: true,
          colorize: false,
          errorProps: '*'
        }
      },
      serializers: {
        err: pino.stdSerializers.err,
        error: pino.stdSerializers.err
      }
    })
    expect(pino).toHaveBeenCalledTimes(1)
    pino.mockClear()

    const logger2 = getLogger()
    expect(logger2).toBe(logger)
    expect(pino).not.toHaveBeenCalled()
  })

  it('returns child logger and cache it', async () => {
    const name = faker.commerce.productMaterial()
    const level = faker.random.arrayElement(['trace', 'error', 'warning'])

    const logger = getLogger(name, level)

    expect(logger).toBe(loggers[name])
    expect(loggers.core.child).toHaveBeenCalledWith({ name }, { level })
    expect(loggers.core.child).toHaveBeenCalledTimes(1)
    expect(pino).toHaveBeenCalledTimes(1)
    pino.mockClear()
    loggers.core.child.mockClear()

    const logger2 = getLogger(name, level)
    expect(logger2).toBe(logger)
    expect(loggers.core.child).not.toHaveBeenCalled()
    expect(pino).not.toHaveBeenCalled()
  })

  it('set level when run with in dev', async () => {
    process.env.NODE_ENV = 'dev'
    const name = faker.random.word()

    getLogger()
    expect(pino).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'core',
        level: 'debug'
      })
    )

    getLogger(name)
    expect(loggers.core.child).toHaveBeenCalledWith(
      { name },
      { level: 'debug' }
    )
  })

  it('set level when run without jest', async () => {
    process.env.NODE_ENV = 'production'
    const name = faker.random.word()
    getLogger()
    expect(pino).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'core',
        level: 'info'
      })
    )

    getLogger(name)
    expect(loggers.core.child).toHaveBeenCalledWith({ name }, { level: 'info' })
  })

  it('uses level spec when creating loggers', async () => {
    const level1 = 'trace'
    const level2 = 'trace'
    const name = 'child'
    await fs.writeFile(levelFile, `core=${level1}\nchild=${level2}`)

    getLogger()
    expect(pino).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'core',
        level: level1
      })
    )

    getLogger(name)
    expect(loggers.core.child).toHaveBeenCalledWith({ name }, { level: level2 })
  })

  it('changes specific logger level on SIGUSR2', async () => {
    const name1 = 'models/tracks'
    const name2 = 'services/files'
    expect(getLogger()).toBe(loggers.core)
    expect(getLogger(name1)).toBe(loggers[name1])
    expect(getLogger(name2)).toBe(loggers[name2])

    const newLevel = faker.random.arrayElement(['trace', 'error', 'warn'])

    await fs.writeFile(levelFile, `${name1}=${newLevel}`)
    process.emit('SIGUSR2')

    await new Promise(r => setTimeout(r, 200))

    expect(setters.core).not.toHaveBeenCalled()
    expect(setters[name1]).toHaveBeenCalledWith(newLevel)
    expect(setters[name2]).not.toHaveBeenCalled()
  })

  it('refreshes logger levels with wildcard', async () => {
    const name1 = 'models/tracks'
    const name2 = 'models/artists'
    expect(getLogger()).toBe(loggers.core)
    expect(getLogger(name1)).toBe(loggers[name1])
    expect(getLogger(name2)).toBe(loggers[name2])

    const newLevel = faker.random.arrayElement(['trace', 'error', 'warn'])

    await fs.writeFile(levelFile, `models/*=${newLevel}`)
    refreshLogLevels()

    expect(setters.core).not.toHaveBeenCalled()
    expect(setters[name1]).toHaveBeenCalledWith(newLevel)
    expect(setters[name2]).toHaveBeenCalledWith(newLevel)
  })

  if (process.platform !== 'win32') {
    // Windows does not support permission ;P
    it('throws error on unparseable logger levels file', async () => {
      await fs.chmod(levelFile, fs.constants.S_IWUSR)
      expect(() => getLogger()).toThrow(/EACCES/)
    })
  }

  it('throws error on unknown logger levels', async () => {
    await fs.writeFile(levelFile, `core=unknown`)
    expect(() => getLogger()).toThrow(/unsupported log level/)
  })
})
