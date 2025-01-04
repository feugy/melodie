import fs from 'node:fs'
import { isNativeError } from 'node:util/types'
import { type Logger, levels, pino, stdSerializers } from 'pino'

export type { Logger }

export type Level =
	| 'fatal'
	| 'error'
	| 'warn'
	| 'info'
	| 'debug'
	| 'trace'
	| 'silent'

const loggers = new Map<string, Logger>()
const supportedLevels = Object.keys(levels.values) as Level[]
supportedLevels.push('silent')

/* A logger name and its level. */
type LevelEntry = [string, Level]

let root: Logger
let levelSpecs: LevelEntry[]

/* Synchronously reads the level confguration file, to build the level specification.. */
function readLevels() {
	const levelFile = process.env.LOG_LEVEL_FILE ?? '.log-levels'
	try {
		return buildLevels(fs.readFileSync(levelFile, 'utf8'))
	} catch (err) {
		if (!isNativeError(err) || !('code' in err) || err.code !== 'ENOENT') {
			throw new Error(
				`failed to read level file ${levelFile}: ${(err as Error).message}`
			)
		}
	}
	return []
}

/* Builds the level specification out of the configuration file content. */
function buildLevels(configuration: string): LevelEntry[] {
	return configuration
		? configuration
				.split('\n')
				.filter(n => !n.startsWith('#') && n.includes('='))
				.map(term => {
					const [spec = '', level = ''] = term
						.trim()
						.split('=')
						.map(n => n.trim())
					if (!supportedLevels.includes(level as Level)) {
						throw new Error(`unsupported log level ${level} for ${spec}`)
					}
					return [spec.replace(/\*/g, ''), level as Level]
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
 */
function computeLevel(name: string, levelSpecs: LevelEntry[]) {
	for (const [spec, level] of levelSpecs) {
		if (name.includes(spec)) {
			return level
		}
	}
	return null
}

function computeDefaultLevel(): Level {
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
 * @param name Logger name
 * @param lvl Logger level
 */
export function getLogger(name = 'core', lvl: Level | undefined = undefined) {
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
				transport:
					process.env.NODE_ENV === 'production'
						? undefined
						: {
								target: 'pino-pretty',
								options: {
									destination: process.env.LOG_DESTINATION,
									translateTime: true,
									colorize: true,
									errorProps: '*'
								}
							},
				serializers: {
					err: stdSerializers.err,
					error: stdSerializers.err
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
export function refreshLogLevels() {
	levelSpecs = readLevels()
	for (const [name, logger] of loggers) {
		const level = computeLevel(name, levelSpecs)
		if (level) {
			logger.level = level
		}
	}
}

process.on('SIGUSR2', refreshLogLevels)
