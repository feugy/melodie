import type { Stats } from 'node:fs'
import { getLogger } from '@melodie/common/utils'
import { Repeater } from '@repeaterjs/repeater'
import { type ChokidarOptions, watch as doWatch } from 'chokidar'
import { excludeDescendants } from './files.ts'

interface AdditionOrChangeEvent {
	kind: 'addition' | 'change'
	path: string
	stats: Stats
}
interface DeletionEvent {
	kind: 'deletion'
	path: string
}
interface ErrorEvent {
	kind: 'error'
	error: Error
}

export type WatchEvent = AdditionOrChangeEvent | DeletionEvent | ErrorEvent

function watchSingle(
	folder: string,
	signal: AbortSignal,
	options: ChokidarOptions
) {
	const logger = getLogger('utils/watch')

	return new Repeater<WatchEvent, void, void>((push, stop) => {
		logger.info({ folder }, 'start watching')
		const watcher = doWatch(folder, options)
			.on('add', (path, stats) => {
				if (stats) {
					logger.debug({ folder, path, stats }, 'added')
					push({ kind: 'addition', path, stats })
				}
			})
			.on('change', (path, stats) => {
				if (stats) {
					logger.debug({ folder, path, stats }, 'changed')
					push({ kind: 'change', path, stats })
				}
			})
			.on('unlink', path => {
				logger.debug({ folder, path }, 'removed')
				push({ kind: 'deletion', path })
			})
			.on('error', error => {
				logger.error({ folder, error }, 'received error')
				push({ kind: 'error', error: error as Error })
			})
		signal.addEventListener(
			'abort',
			async () => {
				logger.info({ folder }, 'stop watching')
				await watcher.close()
				stop()
			},
			{ once: true }
		)
	})
}

/**
 * Watch File System changes on multiple folders, stopping at the first error.
 * Can be interrupted with an abort controller.
 * @param folders List of folders to watch.
 * @param signal Abort signal.
 */
export async function* watch(folders: string[], controller: AbortController) {
	const watchers = excludeDescendants(folders).map(folder =>
		watchSingle(folder, controller.signal, {
			ignoreInitial: true,
			followSymlinks: true,
			alwaysStat: true,
			awaitWriteFinish: {
				stabilityThreshold: 200,
				pollInterval: 100
			}
		})
	)
	try {
		for await (const event of Repeater.merge(watchers)) {
			yield event
		}
	} catch (err) {
		controller.abort()
	}
}
