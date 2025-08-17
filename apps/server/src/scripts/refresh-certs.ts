import { join } from 'node:path'
import * as acme from 'acme-client'
import { file } from 'bun'
import { configurationService } from '../services/configuration.ts'

export async function refreshCerts({
	email,
	port,
	config
}: { email: string; port: string; config: string }) {
	const certFile = file(join(config, 'tls/cert.pem'))
	const {
		domains: { commonName: domain }
	} = acme.crypto.readCertificateInfo(await certFile.text())
	await configurationService.generateCertificates(config, {
		port: Number.parseInt(port ?? '80'),
		domain,
		email
	})
}
