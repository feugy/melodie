import type { Agent, Track } from '@melodie/common/models'
import { getAudioURL } from './agent'
import { handleUnauthorizedResponse } from './requests.ts'

class TrackCache {
	private folder: FileSystemDirectoryHandle | null = null
	private initPromise: Promise<void> | null = null
	private inProgress = new Map<number, Promise<FileSystemFileHandle | null>>()
	private agentById = new Map<number, Agent>()
	private maxSize: number
	private currentSize = 0
	private lru: number[] = []
	private fileSizes = new Map<number, number>()

	constructor(maxSize: number = 1024 * 1024 * 1024) {
		this.maxSize = maxSize
	}

	setAgentById(agentById: Map<number, Agent>) {
		this.agentById = agentById
	}

	// Ensure the track is cached in OPFS; used for background prewarming.
	async addToCache(track: Track | undefined) {
		const url = getAudioURL(track, this.agentById)
		await this.ensureInitialized()
		if (!this.folder || !track?.id || !url) return

		let promise = this.inProgress.get(track.id)
		if (!promise) {
			promise = this.downloadTrack(track.id, url)
			this.inProgress.set(track.id, promise)
		}
		return promise
	}

	// Return remote playback URL immediately and start cache fill in background.
	getTrackURLAndCache(track: Track | undefined) {
		const url = getAudioURL(track, this.agentById)
		if (track?.id && url) {
			void this.addToCache(track)
		}
		return url
	}

	// Return cached playback URL if available locally, without fetching network data.
	async readCachedTrack(track: Track | undefined) {
		await this.ensureInitialized()
		if (!this.folder || !track?.id || !this.fileSizes.has(track.id)) return

		try {
			const fileHandle = await this.folder.getFileHandle(`${track.id}`)
			return URL.createObjectURL(await fileHandle.getFile())
		} catch {
			await this.removeTrack(track.id)
			return
		}
	}

	private async init() {
		if (this.folder) return
		try {
			this.folder = await (
				await navigator.storage.getDirectory()
			).getDirectoryHandle('melodie-audio', {
				create: true
			})
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
						if (file.size <= 0) {
							await this.folder.removeEntry(name)
							continue
						}
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

	private async ensureInitialized() {
		if (!this.initPromise) {
			this.initPromise = this.init()
		}
		await this.initPromise
	}

	private async ensureCacheLimit() {
		if (!this.folder) throw new Error('TrackCache not initialized')
		if (this.currentSize <= this.maxSize) return

		while (this.currentSize > this.maxSize && this.lru.length > 0) {
			const oldestId = this.lru[0]
			await this.removeTrack(oldestId)
		}
	}

	private async removeTrack(id: number) {
		if (!this.folder) throw new Error('TrackCache not initialized')

		try {
			const size = this.fileSizes.get(id) ?? 0
			this.currentSize = Math.max(0, this.currentSize - size)
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

	private async downloadTrack(id: number, url: string) {
		if (!this.folder) throw new Error('TrackCache not initialized')

		try {
			if (this.fileSizes.has(id)) {
				try {
					return await this.folder.getFileHandle(`${id}`)
				} catch {
					await this.removeTrack(id)
				}
			}

			const response = await fetch(url)
			if (
				(await handleUnauthorizedResponse(response)) ||
				!response.ok ||
				!response.body
			) {
				return null
			}

			let actualSize = 0
			const fileHandle = await this.folder.getFileHandle(`${id}`, {
				create: true
			})
			try {
				await response.body.pipeTo(await fileHandle.createWritable())
				const file = await fileHandle.getFile()
				actualSize = file.size
				if (actualSize <= 0) {
					throw new Error('Downloaded file is empty')
				}
			} catch {
				await this.removeTrack(id)
				return null
			}

			// Update metadata
			this.fileSizes.set(id, actualSize)
			if (!this.lru.includes(id)) {
				this.lru.push(id)
			}
			this.currentSize += actualSize
			// Final check in case actual size differed from header
			await this.ensureCacheLimit()

			return fileHandle
		} finally {
			this.inProgress.delete(id)
		}
	}
}

export { TrackCache }
export const trackCache = new TrackCache()
