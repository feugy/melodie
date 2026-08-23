import type { Agent, Track } from '@melodie/common/models'
import { downloadZip } from 'client-zip'
import localforage from 'localforage'
import { SvelteMap } from 'svelte/reactivity'
import { getAudioURL } from './agent'
import { handleUnauthorizedResponse } from './requests.ts'

const storageKey = 'local-library-handle'

const sep = '/'

type LibraryState = 'disconnected' | 'needs-reconnect' | 'connected'

class LocalLibrary {
	state = $state<LibraryState>('disconnected')
	supported = $state(false)

	// Chrome: persistent read/write FileSystemDirectoryHandle stored in IDB
	private handle: FileSystemDirectoryHandle | null = null
	// Firefox: in-session Map built from <input webkitdirectory>
	private fileMap: Map<string, File> | null = null
	// Firefox: name of the folder picked via <input webkitdirectory>
	private folder: string | null = null

	private availability = new SvelteMap<string, boolean>()
	// Resolved once init() has finished; lets getURL/check await startup safely.
	private initPromise: Promise<void> | null = null

	private agentById = new Map<number, Agent>()
	setAgentById(agentById: Map<number, Agent>) {
		this.agentById = agentById
	}

	get connected() {
		return this.state === 'connected'
	}

	get folderName() {
		return this.handle?.name ?? this.folder
	}

	/** Returns true if the track's file is confirmed in the local library, false if absent, undefined if not yet checked. */
	isLocal(track: Track | undefined): boolean | undefined {
		return track?.path ? this.availability.get(track.path) : undefined
	}

	/**
	 * Called on mount. Detects available APIs, and silently restores a previously granted handle
	 * from IndexedDB with no user interaction required.
	 */
	async init() {
		// Set up the promise synchronously so getURL/check can await it even
		// when called before init() itself has been awaited by the caller.
		let resolve!: () => void
		this.initPromise = new Promise<void>(r => {
			resolve = r
		})

		try {
			if (typeof window === 'undefined') {
				return
			}

			this.supported =
				'showDirectoryPicker' in window ||
				'webkitdirectory' in document.createElement('input')

			if (!this.supported || !('showDirectoryPicker' in window)) {
				return
			}
			// Chrome-only: try to silently restore a previously stored handle.

			localforage.config({ driver: localforage.INDEXEDDB, name: 'melodie' })

			const stored =
				await localforage.getItem<FileSystemDirectoryHandle>(storageKey)
			if (!stored) return

			const permission = await stored.queryPermission({ mode: 'readwrite' })
			this.handle = stored
			this.state = permission === 'granted' ? 'connected' : 'needs-reconnect'
		} finally {
			resolve()
		}
	}

	/**
	 * Connects to the local music folder.
	 */
	async connect() {
		this.availability.clear()

		if ('showDirectoryPicker' in window) {
			const handle = await window.showDirectoryPicker({
				mode: 'readwrite',
				startIn: 'music'
			})
			this.handle = handle
			await localforage.setItem(storageKey, handle)
			// Protects the IDB-stored handle from eviction under storage pressure;
			// FS Access permissions themselves persist via install status or the
			// "Allow on every visit" prompt choice.
			await navigator.storage?.persist()
		} else {
			// Firefox (and any browser without File System Access API):
			// use a hidden <input webkitdirectory> for in-session access.
			const files = await this._pickDirectoryViaInput()
			if (!files.length) return // user cancelled
			// webkitRelativePath = "RootFolder/artist/album/track.flac"
			// Strip the leading folder name to get the relativePath that
			// matches track.path on the client.
			this.folder = files[0].webkitRelativePath.split(sep)[0] ?? null
			this.fileMap = new Map(
				files
					.filter(f => f.webkitRelativePath.includes(sep))
					.map(f => [f.webkitRelativePath.split(sep).slice(1).join(sep), f])
			)
		}

		this.state = 'connected'
	}

	/** Re-uses the stored handle to request permission after a new browser session. */
	async reconnect() {
		if (!this.handle) return
		const permission = await this.handle.requestPermission({
			mode: 'readwrite'
		})
		if (permission === 'granted') {
			this.availability.clear()
			this.state = 'connected'
		}
	}

	/** Clears all local state and removes the stored handle from IndexedDB. */
	async disconnect() {
		this.handle = null
		this.fileMap = null
		this.folder = null
		this.availability.clear()
		await localforage.removeItem(storageKey)
		this.state = 'disconnected'
	}

	/**
	 * Checks whether a track's file exists locally and caches the boolean result
	 * in the reactive availability map. Subsequent calls for the same path are no-ops.
	 */
	async check(track: Track | undefined): Promise<void> {
		if (this.initPromise) await this.initPromise
		if (!track?.path || this.availability.has(track.path)) return
		if (!this.handle && !this.fileMap) return

		if (this.handle) {
			try {
				await this._getFileHandle(track.path)
				this.availability.set(track.path, true)
			} catch {
				this.availability.set(track.path, false)
			}
		} else if (this.fileMap) {
			this.availability.set(track.path, this.fileMap.has(track.path))
		}
	}

	/**
	 * Returns a blob URL for direct local playback of the given track, or null
	 * if not connected or the file is not found. The caller must revoke the URL
	 * via URL.revokeObjectURL() when done.
	 */
	async getURL(track: Track | undefined): Promise<string | null> {
		if (this.initPromise) await this.initPromise
		if (!track?.path) return null

		if (this.handle) {
			try {
				const fileHandle = await this._getFileHandle(track.path)
				return URL.createObjectURL(await fileHandle.getFile())
			} catch {
				return null
			}
		}

		if (this.fileMap) {
			const file = this.fileMap.get(track.path)
			return file ? URL.createObjectURL(file) : null
		}

		return null
	}

	/**
	 * Downloads the given tracks and writes them into a user-selected directory,
	 * recreating the subfolder structure from each track's relative path.
	 *
	 * Chrome: reuses the library handle when its read/write permission is still
	 * granted, or use the directory picker, and streams each file into
	 * place.
	 * Browsers without the File System Access API (Firefox): fetches
	 * all tracks then bundles them into a single .zip preserving the folder
	 * structure — individual downloads could neither create intermediate
	 * folders nor target a chosen destination.
	 *
	 * Yields progress after each track is saved/zipped.
	 */
	async *saveToDevice(
		tracks: Track[]
	): AsyncGenerator<{ done: number; total: number }> {
		if (!('showDirectoryPicker' in window)) {
			yield* this._downloadViaZip(tracks)
			return
		}

		if (
			!this.handle ||
			(await this.handle.queryPermission({ mode: 'readwrite' })) !== 'granted'
		) {
			this.handle = await window.showDirectoryPicker({
				mode: 'readwrite',
				startIn: 'music'
			})
		}

		for (let i = 0; i < tracks.length; i++) {
			const track = tracks[i]
			const url = getAudioURL(track, this.agentById)
			if (!url) continue

			const parts = track.path.split(sep)
			const filename = parts.at(-1) ?? ''
			const dirs = parts.slice(0, -1)

			let currentDir = this.handle
			for (const part of dirs) {
				currentDir = await currentDir.getDirectoryHandle(part, { create: true })
			}

			const response = await fetch(url)
			if (await handleUnauthorizedResponse(response)) continue
			if (!response.ok || !response.body) continue

			const fileHandle = await currentDir.getFileHandle(filename, {
				create: true
			})
			await response.body.pipeTo(await fileHandle.createWritable())

			yield { done: i + 1, total: tracks.length }
		}

		for (const track of tracks) {
			if (track?.path) this.availability.delete(track.path)
			this.check(track)
		}
	}

	private async *_downloadViaZip(
		tracks: Track[]
	): AsyncGenerator<{ done: number; total: number }> {
		const files: { name: string; input: ReadableStream }[] = []

		for (let i = 0; i < tracks.length; i++) {
			const track = tracks[i]
			const url = getAudioURL(track, this.agentById)
			if (!url) continue

			const response = await fetch(url)
			if (await handleUnauthorizedResponse(response)) continue
			if (!response.ok || !response.body) continue

			files.push({ name: track.path, input: response.body })
			yield { done: i + 1, total: tracks.length }
		}

		if (!files.length) return

		// Audio is already compressed; client-zip stores entries losslessly
		// (STORE) which keeps zipping fast and the archive size identical.
		const blob = await downloadZip(files).blob()

		const blobUrl = URL.createObjectURL(blob)
		const anchor = document.createElement('a')
		anchor.href = blobUrl
		anchor.download = `${this.folderName?.replace(/[\\/:*?"<>|]+/g, '-').trim()}.zip`
		document.body.appendChild(anchor)
		anchor.click()
		anchor.remove()
		URL.revokeObjectURL(blobUrl)
	}

	private async _getFileHandle(
		relativePath: string
	): Promise<FileSystemFileHandle> {
		if (!this.handle) throw new Error('no handle')
		const parts = relativePath.split(sep)
		const filename = parts.at(-1) ?? ''
		const dirs = parts.slice(0, -1)
		let dir: FileSystemDirectoryHandle = this.handle
		for (const part of dirs) {
			dir = await dir.getDirectoryHandle(part)
		}
		return dir.getFileHandle(filename)
	}

	/** Opens a hidden <input webkitdirectory> and resolves with the selected files. */
	private _pickDirectoryViaInput(): Promise<File[]> {
		return new Promise(resolve => {
			const input = document.createElement('input')
			input.type = 'file'
			input.webkitdirectory = true
			input.style.display = 'none'
			document.body.appendChild(input)

			const cleanup = (files: File[]) => {
				document.body.removeChild(input)
				resolve(files)
			}

			input.addEventListener('change', () =>
				cleanup(Array.from(input.files ?? []))
			)
			input.addEventListener('cancel', () => cleanup([]))
			input.click()
		})
	}
}

export const localLibrary = new LocalLibrary()
