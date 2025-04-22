import {
	type Mock,
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	mock
} from 'bun:test'
import { constants, chmod, unlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import { join } from 'node:path'
import { faker } from '@faker-js/faker'
import { env } from 'bun'
import * as originalPino from 'pino'
import type { Logger } from 'pino'
import type * as T from './logger.ts'

let getLogger: typeof T.getLogger
let refreshLogLevels: typeof T.refreshLogLevels
const pino = mock<() => Logger>()
const loggers: Record<string, Logger & { child: Mock<() => unknown> }> = {}
const setters: Record<string, Mock<() => unknown>> = {}

mock.module('pino', async () => {
	const { default: _unused, ...others } = originalPino

	function setupLogger(name: string, proto = {}) {
		loggers[name] = proto as Logger & { child: Mock<() => unknown> }
		setters[name] = mock()
		Object.defineProperty(loggers[name], 'level', { set: setters[name] })
		return loggers[name]
	}

	setupLogger('core', {
		child: mock().mockImplementation(({ name }) => setupLogger(name))
	})

	pino.mockReturnValue(loggers.core)
	return { ...others, pino }
})

describe('getLogger()', () => {
	const envSave = Object.assign({}, env)
	const levelFile = join(os.tmpdir(), '.log-levels-test')

	beforeEach(async () => {
		Object.assign(env, envSave)
		env.LOG_LEVEL_FILE = levelFile
		env.LOG_DESTINATION = '1'
		await writeFile(levelFile, '')
		delete require.cache[join(import.meta.dir, 'logger.ts')]
		;({ getLogger, refreshLogLevels } = require('./logger.ts'))
		loggers.core.child.mockClear()
		pino.mockClear()
	})

	afterEach(async () => {
		try {
			await unlink(levelFile)
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
			serializers: expect.any(Object)
		})
		expect(pino).toHaveBeenCalledTimes(1)
		pino.mockClear()

		const logger2 = getLogger()
		expect(logger2).toBe(logger)
		expect(pino).not.toHaveBeenCalled()
	})

	it('returns child logger and cache it', async () => {
		const name = faker.commerce.productMaterial()
		const level = faker.helpers.arrayElement([
			'trace',
			'error',
			'warning'
		]) as T.Level

		const logger = getLogger(name, level)

		expect(logger).toBe(loggers[name])
		expect(loggers.core.child).toHaveBeenCalledWith({ name }, { level })
		pino.mockClear()
		loggers.core.child.mockClear()

		const logger2 = getLogger(name, level)
		expect(logger2).toBe(logger)
		expect(loggers.core.child).not.toHaveBeenCalled()
		expect(pino).not.toHaveBeenCalled()
	})

	it('sets level when run with in dev', async () => {
		env.NODE_ENV = 'dev'
		const name = faker.word.noun()

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
		expect(loggers.core.child).toHaveBeenCalledTimes(1)
		expect(pino).toHaveBeenCalledTimes(1)
	})

	it('sets level when running in production', async () => {
		env.NODE_ENV = 'production'
		const name = faker.word.noun()
		getLogger()
		expect(pino).toHaveBeenCalledWith(
			expect.objectContaining({
				name: 'core',
				level: 'warn'
			})
		)

		getLogger(name)
		expect(loggers.core.child).toHaveBeenCalledWith({ name }, { level: 'warn' })
		expect(loggers.core.child).toHaveBeenCalledTimes(1)
		expect(pino).toHaveBeenCalledTimes(1)
	})

	it('uses level spec when creating loggers', async () => {
		const level1 = 'trace'
		const level2 = 'trace'
		const name = 'child'
		await writeFile(levelFile, `core=${level1}\nchild=${level2}`)

		getLogger()
		expect(pino).toHaveBeenCalledWith(
			expect.objectContaining({
				name: 'core',
				level: level1
			})
		)

		getLogger(name)
		expect(loggers.core.child).toHaveBeenCalledWith({ name }, { level: level2 })
		expect(loggers.core.child).toHaveBeenCalledTimes(1)
		expect(pino).toHaveBeenCalledTimes(1)
	})

	it('changes specific logger level on SIGUSR2', async () => {
		const name1 = 'models/tracks'
		const name2 = 'services/files'
		expect(getLogger()).toBe(loggers.core)
		expect(getLogger(name1)).toBe(loggers[name1])
		expect(getLogger(name2)).toBe(loggers[name2])

		const newLevel = faker.helpers.arrayElement(['trace', 'error', 'warn'])

		await writeFile(levelFile, `${name1}=${newLevel}`)
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

		const newLevel = faker.helpers.arrayElement(['trace', 'error', 'warn'])

		await writeFile(levelFile, `models/*=${newLevel}`)
		refreshLogLevels()

		expect(setters.core).not.toHaveBeenCalled()
		expect(setters[name1]).toHaveBeenCalledWith(newLevel)
		expect(setters[name2]).toHaveBeenCalledWith(newLevel)
	})

	if (process.platform !== 'win32') {
		// Windows does not support permission ;P
		it('throws error on unparseable logger levels file', async () => {
			await chmod(levelFile, constants.S_IWUSR)
			expect(() => getLogger()).toThrow(/EACCES/)
		})
	}

	it('throws error on unknown logger levels', async () => {
		await writeFile(levelFile, 'core=unknown')
		expect(() => getLogger()).toThrow(/unsupported log level/)
	})
})
