import { join } from 'node:path'
import * as acme from 'acme-client'
import { file } from 'bun'
import { configurationService } from '../services/configuration.ts'

export async function refreshCerts({
	email,
	port,
	config,
	help
}: {
	email: string
	port: string
	config: string
	help?: boolean
}) {
	if (help) {
		console.log(`Usage: melodie refresh-certs [options]

Refresh TLS certificates using Let's Encrypt.

Options:
  -c, --config <path>  Config folder (default: .melodie)
  -p, --port <port>    Port for HTTP challenge (default: 80)
  -e, --email <email>  Email for Let's Encrypt (required)
  -h, --help           Show this help`)
		return
	}

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
