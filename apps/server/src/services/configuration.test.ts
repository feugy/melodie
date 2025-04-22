import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	mock,
	spyOn
} from 'bun:test'
import { access, cp, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { faker } from '@faker-js/faker'
import { AbstractModel, settingsModel } from '@melodie/common/models'
import * as acme from 'acme-client'
import { file } from 'bun'
import { configurationService as service } from './configuration.ts'

const acmeClient = mock()

mock.module('acme-client', () => ({
	...acme,
	Client: acmeClient
}))

describe('configuration service', () => {
	const folder = join(tmpdir(), '.melodie')
	const tlsFolderPath = join(folder, 'tls')
	const certPath = join(tlsFolderPath, 'cert.pem')
	const keyPath = join(tlsFolderPath, 'key.pem')
	const csrPath = join(tlsFolderPath, 'csr.pem')
	const imageFolderPath = join(folder, '.images')
	const dbFilePath = join(folder, '.db.sqlite3')

	beforeEach(async () => {
		await rm(folder, { recursive: true, force: true })
	})

	afterEach(async () => {
		await AbstractModel.release()
	})

	describe('given no configuration folder', () => {
		it('reads port and folders from command line and initiate configuration', async () => {
			const port = faker.number.int({ min: 1, max: 65535 })
			const musicFolder = faker.system.directoryPath()
			const readLine = mock()
				.mockResolvedValueOnce({ value: '', done: false }) // fails as its empty
				.mockResolvedValueOnce({ value: musicFolder, done: false })
				.mockResolvedValueOnce({ value: 'coucou', done: false }) // fails as its not a number
				.mockResolvedValueOnce({ value: '-1', done: false }) // fails as its negative
				.mockResolvedValueOnce({ value: `  ${port}  `, done: false })
				.mockResolvedValueOnce({ value: 'n', done: false })

			spyOn(console, 'log').mockReturnValue()
			spyOn(console, Symbol.asyncIterator).mockReturnValueOnce({
				next: readLine,
				[Symbol.asyncIterator]: () => {
					throw new Error('no-op')
				}
			})

			expect(await service.read(['-c', folder])).toEqual({
				host: '0.0.0.0',
				port,
				imageFolder: imageFolderPath,
				folders: [musicFolder],
				database: { filename: dbFilePath },
				openUI: false,
				tls: undefined
			})
			await expect(access(folder)).resolves.toBeNull()
			await expect(access(imageFolderPath)).resolves.toBeNull()
			await expect(access(dbFilePath)).resolves.toBeNull()
			await expect(access(tlsFolderPath)).rejects.toThrow()
			expect(await settingsModel.get()).toEqual({
				id: settingsModel.ID,
				port,
				folders: [musicFolder]
			})
			expect(acmeClient).not.toHaveBeenCalled()
		})

		it('reads default values', async () => {
			const musicFolder = faker.system.directoryPath()
			const readLine = mock()
				.mockResolvedValueOnce({ value: musicFolder, done: false })
				.mockResolvedValueOnce({ value: '', done: false }) // port
				.mockResolvedValueOnce({ value: 'N', done: false })

			spyOn(console, 'log').mockReturnValue()
			spyOn(console, Symbol.asyncIterator).mockReturnValueOnce({
				next: readLine,
				[Symbol.asyncIterator]: () => {
					throw new Error('no-op')
				}
			})

			expect(await service.read(['-c', folder])).toEqual({
				host: '0.0.0.0',
				port: 80,
				imageFolder: imageFolderPath,
				folders: [musicFolder],
				database: { filename: dbFilePath },
				openUI: false,
				tls: undefined
			})
			await expect(access(folder)).resolves.toBeNull()
			await expect(access(imageFolderPath)).resolves.toBeNull()
			await expect(access(dbFilePath)).resolves.toBeNull()
			await expect(access(tlsFolderPath)).rejects.toThrow()
			expect(await settingsModel.get()).toEqual({
				id: settingsModel.ID,
				port: 80,
				folders: [musicFolder]
			})
			expect(acmeClient).not.toHaveBeenCalled()
		})

		it('generates certificates when required', async () => {
			const port = 65432
			const musicFolder = faker.system.directoryPath()
			const readLine = mock()
				.mockResolvedValueOnce({ value: musicFolder, done: false })
				.mockResolvedValueOnce({ value: port.toString(), done: false })
				.mockResolvedValueOnce({ value: '', done: false }) // generate cert
				.mockResolvedValueOnce({ value: 'test', done: false }) // fails as it's not a domain
				.mockResolvedValueOnce({ value: 'foo.acme.org', done: false })
				.mockResolvedValueOnce({ value: 'bar', done: false }) // fails as it's not an email
				.mockResolvedValueOnce({ value: 'john@doo.org', done: false })

			spyOn(console, 'log').mockReturnValue()
			spyOn(console, Symbol.asyncIterator).mockReturnValueOnce({
				next: readLine,
				[Symbol.asyncIterator]: () => {
					throw new Error('no-op')
				}
			})
			const certificateContent =
				'-----BEGIN CERTIFICATE-----\nfoo\n-----END CERTIFICATE-----\n'
			acmeClient.mockReturnValueOnce({
				auto: mock().mockResolvedValueOnce(certificateContent)
			})

			expect(await service.read(['-c', folder])).toEqual({
				host: '0.0.0.0',
				port,
				imageFolder: imageFolderPath,
				folders: [musicFolder],
				database: { filename: dbFilePath },
				openUI: false,
				tls: { cert: certPath, key: keyPath, csr: csrPath }
			})
			await expect(access(folder)).resolves.toBeNull()
			await expect(access(imageFolderPath)).resolves.toBeNull()
			await expect(access(dbFilePath)).resolves.toBeNull()
			await expect(access(certPath)).resolves.toBeNull()
			expect(await file(keyPath).text()).toMatch(/^-----BEGIN PRIVATE KEY-----/)
			expect(await file(csrPath).text()).toMatch(
				/^-----BEGIN CERTIFICATE REQUEST-----/
			)
			expect(await file(certPath).text()).toBe(certificateContent)
			expect(await settingsModel.get()).toEqual({
				id: settingsModel.ID,
				port,
				folders: [musicFolder]
			})
			expect(acmeClient).toHaveBeenCalled()
		})
	})

	describe('given an existing configuration folder', () => {
		beforeEach(async () => {
			await mkdir(folder, { recursive: true })
			await cp(
				resolve(import.meta.dir, '../../../../fixtures/.empty.db.sqlite3'),
				dbFilePath
			)
			await settingsModel.init({ filename: dbFilePath }, false)
		})

		it('reads configuration from database', async () => {
			await mkdir(imageFolderPath, { recursive: true })
			expect(await service.read(['-c', folder])).toEqual({
				host: '0.0.0.0',
				port: 43210,
				imageFolder: imageFolderPath,
				folders: ['/tmp/music1', '/tmp/music2'],
				database: { filename: dbFilePath },
				openUI: false,
				tls: undefined
			})
		})

		it('reads tls configuration from existing folder', async () => {
			await mkdir(imageFolderPath, { recursive: true })
			await mkdir(tlsFolderPath)
			await file(certPath).write('')
			await file(csrPath).write('')
			await file(keyPath).write('')
			expect(await service.read(['-c', folder])).toEqual({
				host: '0.0.0.0',
				port: 43210,
				imageFolder: imageFolderPath,
				folders: ['/tmp/music1', '/tmp/music2'],
				database: { filename: dbFilePath },
				openUI: false,
				tls: { cert: certPath, key: keyPath, csr: csrPath }
			})
		})

		it('set host to localhost when opening UI', async () => {
			await mkdir(imageFolderPath, { recursive: true })
			expect(await service.read(['-c', folder, '--open'])).toEqual({
				host: 'localhost',
				port: 43210,
				imageFolder: imageFolderPath,
				folders: ['/tmp/music1', '/tmp/music2'],
				database: { filename: dbFilePath },
				openUI: true,
				tls: undefined
			})
		})

		it('fails on invalid open flag', async () => {
			await mkdir(imageFolderPath, { recursive: true })
			await expect(service.read(['-c', folder, '-o', 'toto'])).rejects.toThrow(
				`Unexpected argument 'toto'`
			)
		})

		it('fails on negative port', async () => {
			await mkdir(imageFolderPath, { recursive: true })
			await settingsModel.save({ id: settingsModel.ID, port: -1, folders: [] })
			await expect(service.read(['-c', folder])).rejects.toThrow(
				'port must be a positive integer'
			)
		})

		it('fails on invalid port', async () => {
			await mkdir(imageFolderPath, { recursive: true })
			await settingsModel.save({ id: settingsModel.ID, port: 3.9, folders: [] })
			await expect(service.read(['-c', folder])).rejects.toThrow(
				'port must be a positive integer'
			)
		})

		it('fails on invalid folders', async () => {
			await mkdir(imageFolderPath, { recursive: true })
			// @ts-expect-error -- although folders is typed as string[], we can save it with anything
			await settingsModel.save({ id: settingsModel.ID, folders: '' })
			await expect(service.read(['-c', folder])).rejects.toThrow(
				'folders must be an array'
			)
		})

		it('fails on empty folders', async () => {
			await mkdir(imageFolderPath, { recursive: true })
			await settingsModel.save({ id: settingsModel.ID, folders: [] })
			await expect(service.read(['-c', folder])).rejects.toThrow(
				'folders must contain at least 1 element'
			)
		})

		it('fails on invalid folders content', async () => {
			await mkdir(imageFolderPath, { recursive: true })
			// @ts-expect-error -- although folders is typed as string[], we can save it with anything
			await settingsModel.save({ id: settingsModel.ID, folders: [true, 10] })
			await expect(service.read(['-c', folder])).rejects.toThrow(
				'folder #0 must be a string, folder #1 must be a string'
			)
		})

		it('fails on missing image folder', async () => {
			await expect(service.read(['-c', folder])).rejects.toThrow(
				`${imageFolderPath} is not a readable folder`
			)
		})

		it('fails on missing tls cert file', async () => {
			await mkdir(imageFolderPath, { recursive: true })
			await mkdir(tlsFolderPath)
			await file(certPath).write('')
			await file(keyPath).write('')
			await expect(service.read(['-c', folder])).rejects.toThrow(
				`${csrPath} is not a readable file`
			)
		})

		it('fails on missing tls key file', async () => {
			await mkdir(imageFolderPath, { recursive: true })
			await mkdir(tlsFolderPath)
			await file(certPath).write('')
			await file(csrPath).write('')
			await expect(service.read(['-c', folder])).rejects.toThrow(
				`${keyPath} is not a readable file`
			)
		})

		it('fails on missing tls cert file', async () => {
			await mkdir(imageFolderPath, { recursive: true })
			await mkdir(tlsFolderPath)
			await file(csrPath).write('')
			await file(keyPath).write('')
			await expect(service.read(['-c', folder])).rejects.toThrow(
				`${certPath} is not a readable file`
			)
		})
	})
})
