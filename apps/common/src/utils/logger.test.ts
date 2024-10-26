import { constants, chmod, unlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import { join } from 'node:path'
import { faker } from '@faker-js/faker'
import type { Logger } from 'pino'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MockInstance, MockedObject } from 'vitest'
import type * as T from './logger.ts'

let getLogger: typeof T.getLogger
let refreshLogLevels: typeof T.refreshLogLevels
let pino: MockInstance<() => Logger>
const loggers: Record<string, MockedObject<Logger>> = {}
const setters: Record<string, MockInstance> = {}

vi.doMock('pino', async () => {
	const { default: _unused, ...others } = await vi.importActual('pino')

	function setupLogger(name: string, proto = {}) {
		loggers[name] = proto as MockedObject<Logger>
		setters[name] = vi.fn()
		// @ts-expect-error -- we're overriding level with a setter.
		Object.defineProperty(loggers[name], 'level', { set: setters[name] })
		return loggers[name]
	}

	setupLogger('core', {
		child: vi.fn().mockImplementation(({ name }) => setupLogger(name))
	})

	pino = vi.fn().mockReturnValue(loggers.core)
	return { ...others, pino }
})

describe('getLogger()', () => {
	const envSave = Object.assign({}, process.env)
	const levelFile = join(os.tmpdir(), '.log-levels-test')

	beforeEach(async () => {
		vi.resetModules()
		vi.clearAllMocks()
		process.env = {}
		Object.assign(process.env, envSave)
		process.env.LOG_LEVEL_FILE = levelFile
		process.env.LOG_DESTINATION = '1'
		await writeFile(levelFile, '')
		;({ getLogger, refreshLogLevels } = await import('./logger.ts'))
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
			transport: {
				target: 'pino-pretty',
				options: expect.objectContaining({
					destination: process.env.LOG_DESTINATION,
					translateTime: true,
					errorProps: '*'
				})
			},
			serializers: expect.any(Object)
		})
		expect(pino).toHaveBeenCalledTimes(1)
		vi.mocked(pino).mockClear()

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
		expect(loggers.core.child).toHaveBeenCalledTimes(1)
		expect(pino).toHaveBeenCalledTimes(1)
		vi.mocked(pino).mockClear()
		loggers.core.child.mockClear()

		const logger2 = getLogger(name, level)
		expect(logger2).toBe(logger)
		expect(loggers.core.child).not.toHaveBeenCalled()
		expect(pino).not.toHaveBeenCalled()
	})

	it('sets level when run with in dev', async () => {
		process.env.NODE_ENV = 'dev'
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
	})

	it('sets level when run without jest', async () => {
		process.env.NODE_ENV = 'production'
		const name = faker.word.noun()
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
