import { pid } from 'node:process'
import { fileURLToPath } from 'node:url'
import { getLogger } from '@melodie/common/utils'
import { configurationService } from './services/configuration.ts'

async function main() {
	const { host, port, folders, database, imageFolder } =
		await configurationService.read()
	// creates logger after	configurations are loaded
	const logger = getLogger('main')
	logger.info(
		{
			conf: {
				host,
				port,
				folders,
				database: {
					...database,
					password: 'password' in database ? '_redacted_' : undefined
				}
			}
		},
		`starting agent (pid ${pid})...`
	)
	// lazy load to allow configuring singleton's loggers.
	const { init } = await import('@melodie/common/models')
	const { foldersService } = await import('./services/folders.ts')
	const { assetsService } = await import('./services/assets.ts')

	await init(database)
	const base = await assetsService.start({ host, port, imageFolder })

	const stop = async (signalOrError?: string | Error) => {
		const error = typeof signalOrError === 'string' ? undefined : signalOrError
		await assetsService.stop()
		await foldersService.stopWatching()
		logger.info(
			{ folders, error },
			`agent stopped${error ? ' with error' : ''}`
		)
		process.exit(error ? -1 : 0)
	}

	process.on('SIGINT', stop)
	process.on('SIGTERM', stop)
	process.on('unhandledRejection', stop)
	process.on('uncaughtException', stop)

	logger.debug({ folders }, 'comparing folders content with database')
	await foldersService.watchAndCompare(folders, base)
	logger.debug({ folders }, 'comparison done')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	// The script was run directly.
	void main()
}
export default main
