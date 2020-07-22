'use strict'

const faker = require('faker')
const pino = require('pino')
const fs = require('fs-extra')

let getLogger
let refreshLogLevels

jest.mock('pino')

describe('logger', () => {
  const envSave = Object.assign({}, process.env)
  let loggers = {}
  let setters = {}

  function setupLogger(name, proto = {}) {
    loggers[name] = proto
    loggers[name].bindings = jest.fn().mockReturnValue({ name })
    setters[name] = jest.fn()
    Object.defineProperty(loggers[name], 'level', { set: setters[name] })
    return loggers[name]
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    jest.isolateModules(() => {
      ;({ getLogger, refreshLogLevels } = require('./logger'))
    })
    process.env = {}
    Object.assign(process.env, envSave)
    process.env.LOG_LEVEL_FILE = '.levels-test'
    await fs.writeFile(process.env.LOG_LEVEL_FILE, '')
    loggers = {}
    setters = {}
    pino.mockReturnValue(
      setupLogger('core', {
        child: jest.fn().mockImplementation(({ name }) => setupLogger(name))
      })
    )
  })

  afterEach(async () => {
    try {
      await fs.unlink(process.env.LOG_LEVEL_FILE)
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
      prettyPrint: {
        translateTime: true
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
    expect(loggers.core.child).toHaveBeenCalledWith({ name, level })
    expect(loggers.core.child).toHaveBeenCalledTimes(1)
    expect(pino).toHaveBeenCalledTimes(1)
    pino.mockClear()
    loggers.core.child.mockClear()

    const logger2 = getLogger(name, level)
    expect(logger2).toBe(logger)
    expect(loggers.core.child).not.toHaveBeenCalled()
    expect(pino).not.toHaveBeenCalled()
  })

  it('set level when run with rollup', async () => {
    process.env.ROLLUP_WATCH = 'true'
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
    expect(loggers.core.child).toHaveBeenCalledWith({ name, level: 'debug' })
  })

  it('set level when run without jest or rollup', async () => {
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
    expect(loggers.core.child).toHaveBeenCalledWith({ name, level: 'info' })
  })

  it('uses level spec when creating loggers', async () => {
    const level1 = 'trace'
    const level2 = 'trace'
    const name = 'child'
    await fs.writeFile(
      process.env.LOG_LEVEL_FILE,
      `core=${level1}\nchild=${level2}`
    )

    getLogger()
    expect(pino).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'core',
        level: level1
      })
    )

    getLogger(name)
    expect(loggers.core.child).toHaveBeenCalledWith({ name, level: level2 })
  })

  it('changes specific logger level on SIGUSR2', async () => {
    const name1 = 'models/tracks'
    const name2 = 'services/files'
    expect(getLogger()).toBe(loggers.core)
    expect(getLogger(name1)).toBe(loggers[name1])
    expect(getLogger(name2)).toBe(loggers[name2])

    const newLevel = faker.random.arrayElement(['trace', 'error', 'warn'])

    await fs.writeFile(process.env.LOG_LEVEL_FILE, `${name1}=${newLevel}`)
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

    await fs.writeFile(process.env.LOG_LEVEL_FILE, `models/*=${newLevel}`)
    refreshLogLevels()

    expect(setters.core).not.toHaveBeenCalled()
    expect(setters[name1]).toHaveBeenCalledWith(newLevel)
    expect(setters[name2]).toHaveBeenCalledWith(newLevel)
  })

  it('throws error on unparseable logger levels file', async () => {
    await fs.chmod(process.env.LOG_LEVEL_FILE, 0o200)
    expect(() => getLogger()).toThrow(/EACCES/)
  })

  it('throws error on unknown logger levels', async () => {
    await fs.writeFile(process.env.LOG_LEVEL_FILE, `core=unknown`)
    expect(() => getLogger()).toThrow(/unsupported log level/)
  })
})
