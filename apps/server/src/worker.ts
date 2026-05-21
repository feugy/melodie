import { getLogger } from '@melodie/common/utils'
import { fileURLToPath } from 'bun'
import { configurationService } from './services/configuration.ts'

declare const self: Worker

async function worker() {
	try {
		const conf = await configurationService.read(process.argv.slice(2))
		const { folders, database } = conf

		// creates logger after	configurations are loaded
		const logger = getLogger('worker')
		logger.info('starting worker...', { conf })

		// lazy load to allow configuring singleton's loggers.
		const [{ init }, { foldersService }] = await Promise.all([
			import('@melodie/common/models'),
			import('./services/folders.ts')
		])

		await init(database, false)

		async function start(base: string) {
			try {
				postMessage({ type: 'comparing' })
				logger.debug('comparing folders content with database', {
					folders,
					base
				})
				await foldersService.compare(folders, base)
			} finally {
				logger.debug('comparison done', { folders })
				postMessage({ type: 'compared' })
			}
		}

		async function stop() {
			try {
				postMessage({ type: 'stopping' })
				logger.debug('stopping worker...', { folders })
			} finally {
				logger.debug('worker stopped', { folders })
				postMessage({ type: 'stopped' })
			}
		}

		self.onmessage = (event: MessageEvent) => {
			logger.info('message received from main', { event: { data: event.data } })
			if (typeof event.data !== 'object') {
				logger.warn('unexpected message: skipping', { event })
				return
			}
			switch (event.data.type) {
				case 'start':
					void start(event.data.base)
					break
				case 'stop': {
					void stop()
					break
				}
			}
		}

		postMessage({ type: 'ready' })
	} catch (error) {
		console.warn({ error }, 'worker failure')
	}
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	// The script was run from CLI.
	void worker()
}
export default worker
