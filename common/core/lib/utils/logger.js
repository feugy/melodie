import fs from 'fs-extra'
import pino from 'pino'

let root
let levelSpecs
const loggers = new Map()
const supportedLevels = Object.keys(pino.levels.values)
supportedLevels.push('silent')

/**
 * An array containing logger name and its level
 * @typedef {array<string>} LevelEntry
 * @property {string} 0 - the logger name (of a part of it)
 * @property {string} 1 - the desired level
 */

/**
 * logger level specifications
 * @typedef {array<LevelEntry>} LevelSpec
 */

/**
 * Synchronously reads the level confguration file, to build the level specification.
 * @returns {LevelSpec} the level specification
 */
function readLevels() {
  const levelFile = process.env.LOG_LEVEL_FILE
  try {
    return buildLevels(fs.readFileSync(levelFile, 'utf8'))
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw new Error(`failed to read level file ${levelFile}: ${err.message}`)
    }
  }
  return []
}

/**
 * Builds the level specification out of the configuration file content
 * @param {string} configuration - content of the configuration file
 * @returns {LevelSpec} the level specification
 */
function buildLevels(configuration) {
  return configuration
    ? configuration
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

/**
 * Finds a logger level in the level specifications from its name.
 * The first specification entry which is a substring of the logger name will match.
 *
 * given specs of:  ['services/*', 'info']
 *                  ['services/tracks', 'error']
 *                  ['*', 'debug']
 * when computing level ot 'services/tracks'
 * then I'll get 'info'
 *
 * @param {string}                - logger name
 * @param {LevelSpec} levelSpecs  - level specification
 * @returns {string|null} the specificed level, or null
 */
function computeLevel(name, levelSpecs) {
  for (const [spec, level] of levelSpecs) {
    if (name.includes(spec)) {
      return level
    }
  }
  return null
}

/**
 * @returns {string} default level: 'silent' during tests, 'debug' during developement or 'info'
 */
function computeDefaultLevel() {
  const { NODE_ENV } = process.env
  return NODE_ENV === 'test'
    ? 'silent'
    : NODE_ENV === 'production'
      ? 'info'
      : 'debug'
}

/**
 * Builds (or returns a built) a Pino logger instance for a given name.
 * Built loggers are stored in memory so they could be quickly retrieved.
 * The logger is configured to write according to LOG_DESTINATION env variable, with pretty print.
 * If not specified, the level will be computed from configuration file (LOG_LEVEL_PATH env variable)
 * with a default level set to 'info' ('debug' in dev mode, 'silent' in tests).
 * @param {string} [name = 'core']  - logger name
 * @param {string} [lvl = 'info']   - logger level
 * @returns {Pino} a logger instance
 */
export const getLogger = (name = 'core', lvl) => {
  let logger = loggers.get(name)
  if (!logger) {
    if (!levelSpecs) {
      levelSpecs = readLevels()
    }
    const level = lvl || computeLevel(name, levelSpecs) || computeDefaultLevel()
    if (!root) {
      root = pino({
        name: 'core',
        // don't set as parameter default value
        level,
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
    }
    logger = name === 'core' ? root : root.child({ name }, { level })
    loggers.set(name, logger)
  }
  return logger
}

/**
 * Updates level of all built loggers from the configuration file (.level)
 * Can be triggered by sending SIGUSR2 signal to the application.
 */
export const refreshLogLevels = () => {
  levelSpecs = readLevels()
  for (const [name, logger] of loggers) {
    const level = computeLevel(name, levelSpecs)
    if (level) {
      logger.level = level
    }
  }
}

process.on('SIGUSR2', refreshLogLevels)
