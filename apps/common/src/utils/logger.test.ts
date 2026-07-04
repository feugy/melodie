import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { constants, chmod, unlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import { join } from 'node:path'

const levelFile = join(os.tmpdir(), '.log-levels-test')

async function importLogger() {
	return import('./logger.ts')
}

describe('getLogger()', () => {
	beforeEach(async () => {
		process.env.LOG_LEVEL_FILE = levelFile
		process.env.NODE_ENV = 'test'
		await writeFile(levelFile, '')
	})

	afterEach(async () => {
		try {
			await unlink(levelFile)
		} catch {
			// no error on missing file
		}
	})

	it('returns root logger and cache it', async () => {
		const { getLogger } = await importLogger()
		const logger = getLogger('@melodie')
		expect(logger).toBeDefined()
		expect(typeof logger.debug).toBe('function')
		expect(typeof logger.info).toBe('function')
		expect(typeof logger.warn).toBe('function')
		expect(typeof logger.error).toBe('function')
		expect(getLogger('@melodie')).toBe(logger)
	})

	it('returns different loggers for different names', async () => {
		const { getLogger } = await importLogger()
		expect(getLogger('aaa')).not.toBe(getLogger('bbb'))
	})

	it('uses level spec when creating loggers', async () => {
		const name = 'spec-child'
		await writeFile(levelFile, `core=trace\n${name}=trace`)
		const { getLogger } = await importLogger()
		expect(() => getLogger('core')).not.toThrow()
		expect(() => getLogger(name)).not.toThrow()
	})

	if (process.platform !== 'win32') {
		it('throws error on unparseable logger levels file', async () => {
			const { reloadLoggers } = await importLogger()
			await chmod(levelFile, constants.S_IWUSR)
			expect(() => reloadLoggers()).toThrow(/EACCES/)
		})
	}

	it('throws error on unknown logger levels', async () => {
		const { getLogger } = await importLogger()
		await writeFile(levelFile, 'core=unknown')
		expect(() => getLogger('core')).toThrow(/unsupported log level/)
	})

	it('handles SIGUSR2 signal gracefully', async () => {
		const { getLogger, reloadLoggers } = await importLogger()
		getLogger('models/tracks')
		getLogger('services/files')

		await writeFile(levelFile, 'models/tracks=error')
		process.emit('SIGUSR2')

		// allow async handler to process
		await new Promise(r => setTimeout(r, 50))

		expect(() => reloadLoggers()).not.toThrow()
	})

	it('refreshes logger levels with wildcard', async () => {
		const { getLogger, reloadLoggers } = await importLogger()
		getLogger('models/tracks')
		getLogger('models/artists')

		await writeFile(levelFile, 'models/*=error')
		expect(() => reloadLoggers()).not.toThrow()
	})
})
