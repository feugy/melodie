import { join } from 'node:path'
import * as acme from 'acme-client'
import { file } from 'bun'
import { configurationService } from '../services/configuration.ts'

export async function refreshCerts({
	email,
	port,
	config,
	domain: desiredDomain,
	help
}: {
	email: string
	port: string
	config: string
	domain?: string
	help?: boolean
}) {
	if (help) {
		console.log(`Usage: melodie refresh-certs [options]

Create or refresh TLS certificates using Let's Encrypt.

Options:
  -c, --config <path>  Config folder (default: .melodie)
  -p, --port <port>    Port for HTTP challenge (default: 80)
  -e, --email <email>  Email for Let's Encrypt (required)
  -d, --domain <host>  Domain to certify (default: the current certificate's common name)
  -h, --help           Show this help`)
		return
	}

	const domain =
		desiredDomain ||
		acme.crypto.readCertificateInfo(
			await file(join(config, 'tls/cert.pem')).text()
		).domains.commonName
	if (!domain) {
		throw new Error(
			'No domain could be resolved: provide one with -d/--domain or ensure a certificate exists in the config folder.'
		)
	}

	await configurationService.generateCertificates(config, {
		port: Number.parseInt(port ?? '80'),
		domain,
		email
	})
}
