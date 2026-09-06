import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	spyOn
} from 'bun:test'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as acme from 'acme-client'
import { configurationService } from '../services/configuration.ts'

const certInfo = (commonName: string): acme.CertificateInfo =>
	({
		domains: { commonName, altNames: commonName ? [commonName] : [] },
		issuer: {},
		notAfter: new Date(),
		notBefore: new Date()
	}) as acme.CertificateInfo

let refreshCerts: typeof import('./refresh-certs.ts')['refreshCerts']

describe('refresh-certs', () => {
	const folder = join(tmpdir(), '.melodie-test')

	beforeAll(async () => {
		spyOn(configurationService, 'generateCertificates').mockResolvedValue(
			undefined
		)
		;({ refreshCerts } = await import('./refresh-certs.ts'))
	})

	beforeEach(async () => {
		const generate = configurationService.generateCertificates as ReturnType<
			typeof spyOn<typeof configurationService, 'generateCertificates'>
		>
		generate.mockClear()
		await rm(folder, { recursive: true, force: true })
	})

	afterEach(async () => {
		await rm(folder, { recursive: true, force: true })
	})

	it('certifies a domain given with -d/--domain', async () => {
		await refreshCerts({
			config: folder,
			port: '8081',
			email: 'john@doo.org',
			domain: 'melodie.tabulous.fr'
		})

		expect(configurationService.generateCertificates).toHaveBeenCalledWith(
			folder,
			{
				port: 8081,
				domain: 'melodie.tabulous.fr',
				email: 'john@doo.org'
			}
		)
	})

	it('falls back to the existing certificate common name when no domain is provided', async () => {
		await mkdir(join(folder, 'tls'), { recursive: true })
		await writeFile(join(folder, 'tls', 'cert.pem'), 'FAKE-PEM')
		spyOn(acme.crypto, 'readCertificateInfo').mockReturnValueOnce(
			certInfo('existing.example.com')
		)

		await refreshCerts({
			config: folder,
			port: '8081',
			email: 'john@doo.org'
		})

		expect(configurationService.generateCertificates).toHaveBeenCalledWith(
			folder,
			{
				port: 8081,
				domain: 'existing.example.com',
				email: 'john@doo.org'
			}
		)
	})

	it('throws when neither a domain nor a resolvable certificate is available', async () => {
		await mkdir(join(folder, 'tls'), { recursive: true })
		await writeFile(join(folder, 'tls', 'cert.pem'), 'FAKE-PEM')
		spyOn(acme.crypto, 'readCertificateInfo').mockReturnValueOnce(certInfo(''))

		await expect(
			refreshCerts({
				config: folder,
				port: '8081',
				email: 'john@doo.org'
			})
		).rejects.toThrow(/No domain could be resolved/)
		expect(configurationService.generateCertificates).not.toHaveBeenCalled()
	})

	it('prefers provided domain over the existing certificate common name', async () => {
		await mkdir(join(folder, 'tls'), { recursive: true })
		await writeFile(join(folder, 'tls', 'cert.pem'), 'FAKE-PEM')
		spyOn(acme.crypto, 'readCertificateInfo').mockReturnValueOnce(
			certInfo('old.example.com')
		)

		await refreshCerts({
			config: folder,
			port: '8081',
			email: 'john@doo.org',
			domain: 'new.example.com'
		})

		expect(configurationService.generateCertificates).toHaveBeenCalledWith(
			folder,
			{
				port: 8081,
				domain: 'new.example.com',
				email: 'john@doo.org'
			}
		)
	})
})
