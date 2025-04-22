import { describe, expect, it, mock } from 'bun:test'
import { faker } from '@faker-js/faker'
import { configurationService as service } from './configuration.ts'

const env: Record<string, string | undefined> = {}
mock.module('$env/dynamic/private', () => ({ env }))

describe('configuration server utils', () => {
	const validConf = {
		DB_FILENAME: faker.system.filePath()
	}

	function setEnv(values: Record<string, string | undefined>) {
		for (const [key, value] of Object.entries(values)) {
			env[key] = value
		}
	}

	it.each([
		{
			conf: { DB_FILENAME: undefined },
			error: ' DB_FILENAME is required'
		}
	])('throws on invalid conf: $conf', async ({ conf, error }) => {
		setEnv({
			...validConf,
			...conf
		})
		await expect(service.read()).rejects.toThrow(error)
	})

	it('returns complete valid configuration', async () => {
		const filename = faker.system.filePath()
		setEnv({
			...validConf,
			DB_FILENAME: filename
		})
		expect(await service.read()).toEqual({ filename })
	})
})
