import { runScript } from '../run-script.ts'

export async function help(
	_values: Record<string, unknown>,
	positionals: string[]
) {
	const command = positionals[1]

	if (command) {
		await runScript([command, '--help'])
		return
	}

	console.log(`Usage: melodie [options] [command]

In regular mode, mélodie starts an HTTP server on the configured port and serves the web UI until stopped.
In command mode, mélodie runs a single task and exits.

Regular mode options:
  -c, --config <path>  Config folder containing database, images, and TLS certs (default: ./.melodie)
  -o, --open           Open the UI in the default browser on startup

On first run, mélodie will guide you through an interactive setup to configure your music folders and port.

The configuration folder (default: ./.melodie) is expected to contain:
  database:   ./.melodie/.db.sqlite3   (SQLite database with settings and metadata)
  images:     ./.melodie/.images        (optimized album art and thumbnails)
  tls:        ./.melodie/tls/*.pem      (optional: csr.pem, key.pem, cert.pem)

Commands:
  add-user          Create a new user
  refresh-certs     Create or refresh TLS certificates (use -d/--domain to certify a new domain)
  help              Show this help

Run 'melodie <command> --help' for command-specific help.`)
}
