import * as env from '$env/static/private'
import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { configurationService as service } from './configuration.ts'

vi.mock('$env/static/private')

describe('configuration server utils', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	const validConf = {
		DB: 'pg',
		DB_HOST: faker.internet.domainWord(),
		DB_PORT: faker.number.int({ min: 1, max: 65535 }).toString()
	}

	function setEnv(values: Record<string, string | undefined>) {
		for (const [key, value] of Object.entries(values)) {
			vi.spyOn(env, key as 'DB', 'get').mockReturnValue(value as string)
		}
	}

	it.each([
		{
			conf: { DB_PORT: undefined },
			error: ' DB_PORT env variable is required'
		},
		{
			conf: { DB_PORT: 'unparseable' },
			error: ' DB_PORT env variable must be a positive integer'
		},
		{
			conf: { DB_PORT: '14.5' },
			error: ' DB_PORT env variable must be a positive integer'
		},
		{
			conf: { DB_PORT: '-10' },
			error: ' DB_PORT env variable must be a positive integer'
		},
		{
			conf: { DB_HOST: undefined },
			error: ' DB_HOST env variable is required'
		},
		{
			conf: { DB: undefined },
			error: ' DB env variable is required'
		},
		{
			conf: { DB: 'sqlite3', DB_FILENAME: undefined },
			error: ' DB_FILENAME env variable is required'
		}
	])('throws on invalid conf: $conf', async ({ conf, error }) => {
		setEnv({
			...validConf,
			DB_PASSWORD: undefined,
			DB_USER: undefined,
			DB_DATABASE: undefined,
			...conf
		})
		await expect(service.read()).rejects.toThrow(error)
	})

	it('returns partial valid configuration', async () => {
		setEnv({
			...validConf,
			DB_PASSWORD: undefined,
			DB_USER: undefined,
			DB_DATABASE: undefined
		})
		expect(await service.read()).toEqual({
			kind: 'pg',
			host: validConf.DB_HOST,
			port: Number.parseInt(validConf.DB_PORT)
		})
	})
	it('returns complete valid configuration for postgres', async () => {
		const user = faker.internet.username()
		const password = faker.internet.password()
		const database = faker.database.engine()
		setEnv({
			...validConf,
			DB_USER: user,
			DB_PASSWORD: password,
			DB_DATABASE: database
		})
		expect(await service.read()).toEqual({
			kind: 'pg',
			host: validConf.DB_HOST,
			port: Number.parseInt(validConf.DB_PORT),
			user,
			password,
			database
		})
	})

	it('returns complete valid configuration for sqlite3', async () => {
		const filename = faker.system.filePath()
		setEnv({
			...validConf,
			DB: 'sqlite3',
			DB_FILENAME: filename
		})
		expect(await service.read()).toEqual({ kind: 'sqlite3', filename })
	})
})
