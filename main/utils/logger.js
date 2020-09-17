'use strict'

const pino = require('pino')
const fs = require('fs-extra')
const { getLogPath } = require('./files')

let root
let levelSpecs
const loggers = new Map()
const supportedLevels = Object.keys(pino.levels.values)
supportedLevels.push('silent')

function readLevels() {
  const { LOG_LEVEL_FILE = '.levels' } = process.env
  try {
    return fs.readFileSync(LOG_LEVEL_FILE, 'utf8')
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw new Error(
        `failed to read level file ${LOG_LEVEL_FILE}: ${err.message}`
      )
    }
  }
  return null
}

function buildLevels(levels) {
  return levels
    ? levels
        .split('\n')
        .filter(n => !n.startsWith('#') && n.includes('='))
        .map(term => {
          const [spec = '', level = ''] = term
            .trim()
            .split('=')
            .map(n => n.trim())
          if (!supportedLevels.includes(level)) {
            throw new Error(`unsupported log level ${level} for ${spec}`)
          }
          return [spec.replace(/\*/g, ''), level]
        })
    : []
}

function computeLevel(name, levelSpecs) {
  for (const [spec, level] of levelSpecs) {
    if (name.includes(spec)) {
      return level
    }
  }
}

function computeDefaultLevel() {
  const { ROLLUP_WATCH, NODE_ENV } = process.env
  return NODE_ENV === 'test' ? 'silent' : ROLLUP_WATCH ? 'debug' : 'info'
}

exports.getLogger = (name = 'core', lvl) => {
  let logger = loggers.get(name)
  if (!logger) {
    if (!levelSpecs) {
      levelSpecs = buildLevels(readLevels())
    }
    const level = lvl || computeLevel(name, levelSpecs) || computeDefaultLevel()
    if (!root) {
      root = pino(
        {
          name: 'core',
          // don't set as parameter default value
          level,
          base: false,
          prettyPrint: {
            translateTime: true,
            colorize: false,
            errorProps: '*'
          }
        },
        pino.destination(getLogPath())
      )
    }
    logger = name === 'core' ? root : root.child({ name, level })
    loggers.set(name, logger)
  }
  return logger
}

exports.refreshLogLevels = () => {
  levelSpecs = buildLevels(readLevels())
  for (const [, logger] of loggers) {
    const level = computeLevel(logger.bindings().name, levelSpecs)
    if (level) {
      logger.level = level
    }
  }
}

process.on('SIGUSR2', exports.refreshLogLevels)
