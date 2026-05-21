import { pid } from 'node:process'
import { getLogger } from '@melodie/common/utils'
import { fileURLToPath } from 'bun'
import { runScript } from './run-script.ts'
import { configurationService } from './services/configuration.ts'

async function main() {
	const argv = process.argv.slice(2)
	if (await runScript(argv)) {
		console.log('\n\nBye!\n')
		process.exit(0)
	}

	const conf = await configurationService.read(argv)
	let worker: Worker | null = null

	// creates logger after	configurations are loaded
	const logger = getLogger('main')
	logger.info(`starting server (pid ${pid})...`, { conf })
	// lazy load to allow configuring singleton's loggers.
	const { assetsService } = await import('./services/assets.ts')

	const stop = async () => {
		worker?.postMessage({ type: 'stop' })
		await assetsService?.stop()
		if (!worker) {
			process.exit(1)
		}
	}

	process.on('SIGINT', stop)

	const base = await assetsService.start(conf)
	console.log('\nMélodie is running. Press Ctrl+C to stop.\n')

	worker = new Worker('./worker.ts', { argv })

	worker.addEventListener('message', (event: MessageEvent) => {
		logger.info('message received from worker', { event: { data: event.data } })
		if (event.data?.type === 'ready') {
			worker.postMessage({ type: 'start', base })
		} else if (event.data?.type === 'stopped') {
			worker.terminate()
			logger.info('server stopped')
			console.log('\nBye!\n')
			process.exit(0)
		}
	})
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	// The script was run from CLI.
	void main().catch(err => {
		console.log(`\nMelodie crashed :'(\n\n`, err)
		process.exit(1)
	})
}
export default main
