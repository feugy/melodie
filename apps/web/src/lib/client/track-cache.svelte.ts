import type { Agent, Track } from '@melodie/common/models'
import { getData } from './agent'

class TrackCache {
	private folder: FileSystemDirectoryHandle | null = null
	private inProgress = new Map<number, Promise<FileSystemFileHandle | null>>()
	agentById = new Map<number, Agent>()
	private maxSize: number
	private currentSize = 0
	private lru: number[] = []
	private fileSizes = new Map<number, number>()

	constructor(maxSize: number = 1024 * 1024 * 1024) {
		this.maxSize = maxSize
	}

	private async init() {
		if (this.folder) return
		try {
			this.folder = await (
				await navigator.storage.getDirectory()
			).getDirectoryHandle('melodie-audio', {
				create: true
			})
			// Reset state
			this.currentSize = 0
			this.fileSizes.clear()
			this.lru = []

			// load existing tracks: sizes + LRU order
			const files: Array<{ id: number; size: number; lastModified: number }> =
				[]
			for await (const [name, handle] of this.folder.entries()) {
				const id = Number(name)
				if (!Number.isNaN(id) && handle.kind === 'file') {
					try {
						const file = await handle.getFile()
						files.push({ id, size: file.size, lastModified: file.lastModified })
					} catch {
						// File might be inaccessible, skip it
					}
				}
			}
			// Sort by lastModified (oldest first) to build initial LRU order
			files.sort((a, b) => a.lastModified - b.lastModified)
			for (const { id, size } of files) {
				this.currentSize += size
				this.fileSizes.set(id, size)
				this.lru.push(id)
			}
			await this.ensureCacheLimit()
		} catch {
			// OPFS unavailable
		}
	}

	async loadData(track: Track | undefined) {
		const url = getData(track, this.agentById)
		if (!track?.id || !url) return
		await this.init()
		if (!this.inProgress.has(track.id)) {
			return this.readData(track.id, url)
		}
	}

	async getData(track: Track | undefined) {
		if (!track) return
		const { id } = track
		await this.init()

		const url = getData(track, this.agentById)
		// falls back to remote track URL
		if (!url || !this.folder) {
			return url
		}

		let promise = this.inProgress.get(id)
		if (!promise) {
			promise = this.readData(id, url)
			this.inProgress.set(id, promise)
		}
		const file = await promise
		if (!file) {
			return url
		}
		return URL.createObjectURL(await file.getFile())
	}

	private async ensureCacheLimit() {
		if (!this.folder) throw new Error('TrackCache not initialized')
		if (this.currentSize <= this.maxSize) return

		while (this.currentSize > this.maxSize && this.lru.length > 0) {
			const oldestId = this.lru[0]
			await this.evictTrack(oldestId)
		}
	}

	private async evictTrack(id: number) {
		if (!this.folder) throw new Error('TrackCache not initialized')

		try {
			const size = this.fileSizes.get(id) ?? 0
			this.currentSize -= size
			this.fileSizes.delete(id)
			const index = this.lru.indexOf(id)
			if (index > -1) {
				this.lru.splice(index, 1)
			}
			await this.folder.removeEntry(`${id}`)
		} catch {
			// Ignore
		}
	}

	private async readData(id: number, url: string) {
		if (!this.folder) throw new Error('TrackCache not initialized')

		const fileHandle = await this.folder.getFileHandle(`${id}`, {
			create: true
		})
		const needsDownload = !this.fileSizes.has(id)

		if (needsDownload) {
			try {
				const response = await fetch(url)
				if (!response.ok || !response.body) {
					return null
				}

				// Preemptive eviction check using content-length header
				const contentLength = response.headers.get('content-length')
				if (contentLength) {
					const expectedSize = Number.parseInt(contentLength)
					if (this.currentSize + expectedSize > this.maxSize) {
						await this.ensureCacheLimit()
					}
				}

				await response.body.pipeTo(await fileHandle.createWritable())

				// Update metadata
				const file = await fileHandle.getFile()
				const actualSize = file.size
				this.currentSize += actualSize
				this.fileSizes.set(id, actualSize)
				this.lru.push(id)
				// Final check in case actual size differed from header
				await this.ensureCacheLimit()
			} finally {
				this.inProgress.delete(id)
			}
		}

		return fileHandle
	}
}

export { TrackCache }
export const trackCache = new TrackCache()
