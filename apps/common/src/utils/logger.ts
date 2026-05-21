import fs from 'node:fs'
import { isNativeError } from 'node:util/types'
import {
	type Logger,
	ansiColorFormatter,
	configureSync,
	getConsoleSink,
	getLogger as getLogtapeLogger
} from '@logtape/logtape'

export type { Logger }

export type Level = 'fatal' | 'error' | 'warning' | 'info' | 'debug' | 'trace'

const supportedLevels = [
	'trace',
	'debug',
	'info',
	'warning',
	'error',
	'fatal',
	'silent'
]
supportedLevels.push('silent')

const isProd = Bun.env.NODE_ENV === 'production'

/* Synchronously reads the level confguration file, to build the level specification.. */
function configureLoggers() {
	const levelFile = Bun.env.LOG_LEVEL_FILE ?? '.log-levels'
	try {
		return buildLoggers(fs.readFileSync(levelFile, 'utf8'))
	} catch (err) {
		if (!isNativeError(err) || !('code' in err) || err.code !== 'ENOENT') {
			throw new Error(
				`failed to read level file ${levelFile}: ${(err as Error).message}`
			)
		}
	}
	return buildLoggers()
}

/* Builds the level specification out of the configuration file content. */
function buildLoggers(configuration = '') {
	return `logtape/meta=silent
${configuration || ''}`
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
			return {
				category: spec ? spec.split('/') : [],
				filters: [level]
			}
		})
}

function computeDefaultLevel(): Level | 'silent' {
	return Bun.env.NODE_ENV === 'test' ? 'silent' : isProd ? 'warning' : 'debug'
}

let configured = false

function applyConfig() {
	if (configured) return

	configureSync({
		reset: true,
		sinks: {
			console: isProd
				? getConsoleSink()
				: getConsoleSink({ formatter: ansiColorFormatter })
		},
		filters: {
			trace: 'trace',
			debug: 'debug',
			info: 'info',
			warning: 'warning',
			error: 'error',
			fatal: 'fatal',
			silent: null
		},
		loggers: [
			{ category: [], filters: [computeDefaultLevel()], sinks: ['console'] },
			...configureLoggers()
		]
	})
	configured = true
}

/**
 * Builds (or returns a built) a LogTape logger instance for a given name.
 * The logger is configured to write according to LOG_DESTINATION env variable, with pretty print.
 * The level will be computed from configuration file (LOG_LEVEL_PATH env variable)
 * with a default level set to 'warning' ('debug' in dev mode, 'silent' in tests).
 * @param name Logger name
 */
export function getLogger(name: string) {
	applyConfig()
	return getLogtapeLogger(['@melodie', ...name.split('/')])
}

export function reloadLoggers() {
	configured = false
	applyConfig()
}

process.on('SIGUSR2', reloadLoggers)
