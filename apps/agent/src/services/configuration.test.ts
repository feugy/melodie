import { faker } from '@faker-js/faker'
import { afterEach, describe, expect, it } from 'vitest'
import { configurationService as service } from './configuration.ts'

describe('configuration service', () => {
	const envSave = { ...process.env }

	const validConf = {
		PORT: faker.number.int({ min: 1, max: 65535 }).toString(),
		IMAGE_FOLDER: faker.system.directoryPath(),
		FOLDERS: faker.system.directoryPath(),
		DB: 'pg',
		DB_HOST: faker.internet.domainWord(),
		DB_PORT: faker.number.int({ min: 1, max: 65535 }).toString()
	}

	afterEach(() => {
		process.env = { ...envSave }
	})

	it.each([
		{
			conf: { FOLDERS: undefined },
			error: ' FOLDERS env variable must contain at least 1 element'
		},
		{
			conf: { DB_PORT: undefined },
			error: ' DB_PORT env variable is required'
		},
		{
			conf: { DB_HOST: undefined },
			error: ' DB_HOST env variable is required'
		},
		{
			conf: { FOLDERS: '/home,' },
			error: ' FOLDERS env variable value #1 must contain at least 3 characters'
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
			conf: { DB: undefined },
			error: ' DB env variable is required'
		},
		{
			conf: { DB: 'sqlite3' },
			error: ' DB_FILENAME env variable is required'
		},
		{
			conf: { PORT: undefined },
			error: ' PORT env variable is required'
		},
		{
			conf: { PORT: 'unparseable' },
			error: ' PORT env variable must be a positive integer'
		},
		{
			conf: { PORT: '3.9' },
			error: ' PORT env variable must be a positive integer'
		},
		{
			conf: { PORT: '-3' },
			error: ' PORT env variable must be a positive integer'
		},
		{
			conf: { SSL_KEY: './private-key.pem' },
			error: ' SSL_CERT env variable is required'
		},
		{
			conf: { SSL_CERT: './private-key.pem' },
			error: ' SSL_KEY env variable is required'
		},
		{
			conf: { SSL_KEY: './unknown.pem', SSL_CERT: './private-key.pem' },
			error: ' SSL_KEY is not a readable file, SSL_CERT is not a readable file'
		}
	])('throws on invalid conf: $conf', async ({ conf, error }) => {
		process.env = {
			...validConf,
			DB_PASSWORD: undefined,
			DB_USER: undefined,
			DB_DATABASE: undefined,
			HOST: undefined,
			...conf
		}
		await expect(service.read()).rejects.toThrow(error)
	})

	it('returns partial valid configuration', async () => {
		process.env = {
			...validConf,
			HOST: undefined,
			DB_PASSWORD: undefined,
			DB_USER: undefined,
			DB_DATABASE: undefined
		}
		expect(await service.read()).toEqual({
			host: 'localhost',
			port: Number.parseInt(validConf.PORT),
			imageFolder: validConf.IMAGE_FOLDER,
			folders: [validConf.FOLDERS],
			database: {
				kind: 'pg',
				host: validConf.DB_HOST,
				port: Number.parseInt(validConf.DB_PORT)
			}
		})
	})

	it('returns complete valid configuration for postgres', async () => {
		const user = faker.internet.username()
		const password = faker.internet.password()
		const database = faker.database.engine()
		const host = faker.internet.domainName()
		process.env = {
			...validConf,
			HOST: host,
			DB_USER: user,
			DB_PASSWORD: password,
			DB_DATABASE: database
		}
		expect(await service.read()).toEqual({
			host,
			port: Number.parseInt(validConf.PORT),
			imageFolder: validConf.IMAGE_FOLDER,
			folders: [validConf.FOLDERS],
			database: {
				kind: 'pg',
				host: validConf.DB_HOST,
				port: Number.parseInt(validConf.DB_PORT),
				user,
				password,
				database
			}
		})
	})

	it('returns complete valid configuration for sqlite3', async () => {
		const filename = faker.system.filePath()
		const host = faker.internet.domainName()
		process.env = {
			...validConf,
			HOST: host,
			DB: 'sqlite3',
			DB_FILENAME: filename
		}
		expect(await service.read()).toEqual({
			host,
			port: Number.parseInt(validConf.PORT),
			imageFolder: validConf.IMAGE_FOLDER,
			folders: [validConf.FOLDERS],
			database: { kind: 'sqlite3', filename }
		})
	})

	it('returns complete valid configuration with ssl', async () => {
		const filename = faker.system.filePath()
		const host = faker.internet.domainName()
		process.env = {
			...validConf,
			HOST: host,
			DB: 'sqlite3',
			DB_FILENAME: filename,
			SSL_KEY: 'package.json',
			SSL_CERT: 'tsconfig.json'
		}
		expect(await service.read()).toEqual({
			host,
			port: Number.parseInt(validConf.PORT),
			imageFolder: validConf.IMAGE_FOLDER,
			folders: [validConf.FOLDERS],
			database: { kind: 'sqlite3', filename },
			ssl: { cert: 'tsconfig.json', key: 'package.json' }
		})
	})
})
