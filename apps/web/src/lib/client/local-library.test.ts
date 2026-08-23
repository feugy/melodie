import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	mock,
	spyOn
} from 'bun:test'
import { makeAgentById, makeTrack } from '$lib/tests/factories'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import type { Track } from '@melodie/common/models'

const localforageStore = new Map<string, unknown>()
const localforageConfig = mock()
const localforageGetItem = mock(async (key: string) =>
	localforageStore.has(key) ? localforageStore.get(key) : null
)
const localforageSetItem = mock(async (key: string, value: unknown) => {
	localforageStore.set(key, value)
	return value
})
const localforageRemoveItem = mock(async (key: string) => {
	localforageStore.delete(key)
})

mock.module('localforage', () => ({
	default: {
		INDEXEDDB: 'INDEXEDDB',
		config: localforageConfig,
		getItem: localforageGetItem,
		setItem: localforageSetItem,
		removeItem: localforageRemoveItem,
		dropInstance: async () => localforageStore.clear(),
		length: async () => localforageStore.size,
		key: async (i: number) => [...localforageStore.keys()][i] ?? null,
		keys: async () => [...localforageStore.keys()],
		iterate: async (cb: (v: unknown, k: string, i: number) => unknown) => {
			let i = 0
			for (const [k, v] of localforageStore) {
				if ((await cb(v, k, i++)) === false) break
			}
			return null
		},
		createInstance: () => ({
			getItem: localforageGetItem,
			setItem: localforageSetItem,
			removeItem: localforageRemoveItem
		})
	}
}))

mock.module('$app/navigation', () => ({
	goto: async () => void 0,
	invalidate: async () => void 0
}))

mock.module('$app/environment', () => ({ browser: true }))

const NativeWritableStream = globalThis.WritableStream
const originalFetch = globalThis.fetch

const defaultGetItem = async (key: string) =>
	localforageStore.has(key) ? localforageStore.get(key) : null

class FakeFileHandle {
	kind = 'file' as const
	constructor(readonly name: string) {}
	async getFile() {
		return new File(['audio-data'], this.name)
	}
	createWritable() {
		return new NativeWritableStream({
			write() {}
		})
	}
}

class FakeDirectoryHandle {
	kind = 'directory' as const
	children = new Map<string, FakeFileHandle | FakeDirectoryHandle>()
	permission: 'granted' | 'prompt' | 'denied' = 'granted'
	requestResult: 'granted' | 'denied' = 'granted'
	requestCalls = 0
	constructor(readonly name: string) {}
	queryPermission() {
		return Promise.resolve(this.permission)
	}
	requestPermission() {
		this.requestCalls++
		this.permission = this.requestResult
		return Promise.resolve(this.permission)
	}
	async getDirectoryHandle(name: string, opts?: { create?: boolean }) {
		let child = this.children.get(name)
		if (!child || child.kind !== 'directory') {
			if (!opts?.create) throw new Error(`NotFoundError: ${name}`)
			child = new FakeDirectoryHandle(name)
			this.children.set(name, child)
		}
		return child as FakeDirectoryHandle
	}
	async getFileHandle(name: string, opts?: { create?: boolean }) {
		let child = this.children.get(name)
		if (!child || child.kind !== 'file') {
			if (!opts?.create) throw new Error(`NotFoundError: ${name}`)
			child = new FakeFileHandle(name)
			this.children.set(name, child)
		}
		return child as FakeFileHandle
	}
}

type LibraryState = 'disconnected' | 'needs-reconnect' | 'connected'

interface Internals {
	handle: FakeDirectoryHandle | null
	fileMap: Map<string, File> | null
	folder: string | null
	availability: Map<string, boolean>
	state: LibraryState
	initPromise: Promise<void> | null
}

let localLibrary!: typeof import('./local-library.svelte.ts').localLibrary

const internals = () => localLibrary as unknown as Internals
const setPicker = (
	impl?: (options?: {
		mode: string
		startIn: string
	}) => Promise<FakeDirectoryHandle>
) => {
	if (impl) {
		;(window as unknown as Record<string, unknown>).showDirectoryPicker = impl
	} else {
		delete (window as unknown as Record<string, unknown>).showDirectoryPicker
	}
}

let fetchedUrls: string[]
let downloads: string[]
let fetchHandler: (url: string) => Response

const audioResponse = () =>
	new Response(new Blob(['audio-data']), { status: 200 })

async function flushMacrotasks(times = 4) {
	for (let i = 0; i < times; i++) await new Promise(r => setTimeout(r, 0))
}

function makePickedFile(relativePath: string): File {
	const file = new File(['data'], relativePath.split('/').at(-1) ?? '')
	Object.defineProperty(file, 'webkitRelativePath', { value: relativePath })
	return file
}

describe('LocalLibrary', () => {
	let clickAnchorSpy: ReturnType<typeof spyOn>

	beforeAll(async () => {
		GlobalRegistrator.register()
		// happy-dom's <input> predates the webkitdirectory attribute
		Object.defineProperty(HTMLInputElement.prototype, 'webkitdirectory', {
			value: false,
			writable: true,
			configurable: true
		})
		localLibrary = (await import('./local-library.svelte.ts')).localLibrary
		localLibrary.setAgentById(makeAgentById())
		clickAnchorSpy = spyOn(
			HTMLAnchorElement.prototype,
			'click'
		).mockImplementation(function (this: HTMLAnchorElement) {
			downloads.push(this.download ?? '')
		})
		globalThis.fetch = (async (input: RequestInfo | URL) => {
			const url = String(input)
			fetchedUrls.push(url)
			return fetchHandler(url)
		}) as unknown as typeof fetch
	})

	afterAll(() => {
		globalThis.fetch = originalFetch
		clickAnchorSpy.mockRestore()
		const lib = internals()
		lib.handle = null
		lib.fileMap = null
		lib.folder = null
		lib.availability.clear()
		lib.state = 'disconnected'
		lib.initPromise = null
		localforageStore.clear()
		GlobalRegistrator.unregister()
	})

	beforeEach(() => {
		fetchedUrls = []
		downloads = []
		localforageStore.clear()
		localforageConfig.mockClear()
		localforageGetItem.mockClear()
		localforageSetItem.mockClear()
		localforageRemoveItem.mockClear()
		localforageGetItem.mockImplementation(defaultGetItem)
		localforageSetItem.mockImplementation(
			async (key: string, value: unknown) => {
				localforageStore.set(key, value)
				return value
			}
		)
		localforageRemoveItem.mockImplementation(async (key: string) => {
			localforageStore.delete(key)
		})
		fetchHandler = audioResponse
		setPicker(undefined)
		const lib = internals()
		lib.handle = null
		lib.fileMap = null
		lib.folder = null
		lib.availability.clear()
		lib.state = 'disconnected'
	})

	function makeTracks(...paths: string[]): Track[] {
		return paths.map((path, i) => makeTrack({ id: i + 1, agentId: 1, path }))
	}

	describe('init()', () => {
		describe('Chrome', () => {
			it('restores a stored handle silently when permission is granted', async () => {
				setPicker(async () => new FakeDirectoryHandle('picked'))
				const handle = new FakeDirectoryHandle('Music')
				localforageGetItem.mockResolvedValue(handle)

				await localLibrary.init()

				expect(internals().handle).toBe(handle)
				expect(localLibrary.state).toBe('connected')
				expect(localLibrary.connected).toBe(true)
				expect(localLibrary.folderName).toBe('Music')
				expect(localforageConfig).toHaveBeenCalledWith(
					expect.objectContaining({ name: 'melodie' })
				)
			})

			it('enters needs-reconnect when the stored grant expired', async () => {
				setPicker(async () => new FakeDirectoryHandle('picked'))
				const handle = new FakeDirectoryHandle('Music')
				handle.permission = 'prompt'
				localforageGetItem.mockResolvedValue(handle)

				await localLibrary.init()

				expect(localLibrary.state).toBe('needs-reconnect')
				expect(localLibrary.connected).toBe(false)
			})

			it('stays disconnected when nothing was stored', async () => {
				setPicker(async () => new FakeDirectoryHandle('picked'))

				await localLibrary.init()

				expect(localLibrary.state).toBe('disconnected')
				expect(internals().handle).toBeNull()
			})
		})

		describe('Firefox', () => {
			it('detects support from webkitdirectory alone', async () => {
				await localLibrary.init()

				expect(localLibrary.supported).toBe(true)
				expect(localLibrary.state).toBe('disconnected')
				expect(localforageGetItem).not.toHaveBeenCalled()
			})
		})
	})

	describe('connect()', () => {
		describe('Chrome', () => {
			it('picks a readwrite folder, persists it and connects', async () => {
				setPicker(async () => new FakeDirectoryHandle('Music'))
				const persist = mock(async () => true)
				;(navigator as unknown as Record<string, unknown>).storage = { persist }

				try {
					await localLibrary.connect()

					expect(localLibrary.state).toBe('connected')
					expect(internals().handle?.name).toBe('Music')
					expect(localLibrary.folderName).toBe('Music')
					expect(localforageSetItem).toHaveBeenCalledWith(
						'local-library-handle',
						internals().handle
					)
					expect(persist).toHaveBeenCalled()
				} finally {
					delete (navigator as unknown as Record<string, unknown>).storage
				}
			})
		})

		describe('Firefox', () => {
			it('strips the root folder from webkitRelativePath', async () => {
				const files = [
					makePickedFile('Music/air/(1998) Moon Safari/01.flac'),
					makePickedFile('Music/air/(1998) Moon Safari/02.flac'),
					makePickedFile('Music/cover.jpg')
				]
				const clickSpy = spyOn(
					HTMLInputElement.prototype,
					'click'
				).mockImplementation(function (this: HTMLInputElement) {
					queueMicrotask(() => {
						Object.defineProperty(this, 'files', { value: files })
						this.dispatchEvent(new Event('change'))
					})
				})

				try {
					await localLibrary.connect()

					expect(localLibrary.state).toBe('connected')
					expect(localLibrary.folderName).toBe('Music')
					expect([...(internals().fileMap?.keys() ?? [])].sort()).toEqual([
						'air/(1998) Moon Safari/01.flac',
						'air/(1998) Moon Safari/02.flac',
						'cover.jpg'
					])
				} finally {
					clickSpy.mockRestore()
				}
			})

			it('keeps the session disconnected when the picker is cancelled', async () => {
				const clickSpy = spyOn(
					HTMLInputElement.prototype,
					'click'
				).mockImplementation(function (this: HTMLInputElement) {
					queueMicrotask(() => this.dispatchEvent(new Event('cancel')))
				})

				try {
					await localLibrary.connect()

					expect(localLibrary.state).toBe('disconnected')
					expect(internals().fileMap).toBeNull()
				} finally {
					clickSpy.mockRestore()
				}
			})
		})
	})

	describe('reconnect()', () => {
		// requestPermission() only exists on Chrome's FileSystemDirectoryHandle
		describe('Chrome', () => {
			it('does nothing without a stored handle', async () => {
				await localLibrary.reconnect()

				expect(localLibrary.state).toBe('disconnected')
			})

			it('clears cached availability and connects on grant', async () => {
				const handle = new FakeDirectoryHandle('Music')
				internals().handle = handle
				internals().state = 'needs-reconnect'
				internals().availability.set('air/a.flac', false)

				await localLibrary.reconnect()

				expect(handle.requestCalls).toBe(1)
				expect(localLibrary.state).toBe('connected')
				expect(internals().availability.size).toBe(0)
			})

			it('stays in needs-reconnect when the user denies', async () => {
				const handle = new FakeDirectoryHandle('Music')
				handle.requestResult = 'denied'
				internals().handle = handle
				internals().state = 'needs-reconnect'

				await localLibrary.reconnect()

				expect(handle.requestCalls).toBe(1)
				expect(localLibrary.state).toBe('needs-reconnect')
			})
		})
	})

	describe('disconnect()', () => {
		it('clears all state including the Firefox folder name', async () => {
			internals().handle = new FakeDirectoryHandle('Music')
			internals().folder = 'Other Music'
			internals().fileMap = new Map([['a.flac', new File([], 'a.flac')]])
			internals().availability.set('a.flac', true)
			internals().state = 'connected'

			await localLibrary.disconnect()

			expect(localLibrary.state).toBe('disconnected')
			expect(localLibrary.connected).toBe(false)
			expect(localLibrary.folderName).toBeNull()
			expect(internals().handle).toBeNull()
			expect(internals().fileMap).toBeNull()
			expect(internals().folder).toBeNull()
			expect(internals().availability.size).toBe(0)
			expect(localforageRemoveItem).toHaveBeenCalledWith('local-library-handle')
		})
	})

	describe('check() / isLocal()', () => {
		it('returns undefined without a track or a path', async () => {
			expect(localLibrary.isLocal(undefined)).toBeUndefined()
			expect(localLibrary.isLocal({ id: 1 } as Track)).toBeUndefined()
		})

		it('leaves availability untouched while disconnected', async () => {
			const [track] = makeTracks('air/a.flac')

			await localLibrary.check(track)

			expect(localLibrary.isLocal(track)).toBeUndefined()
		})

		describe('Chrome', () => {
			it('resolves against the handle, hit or miss', async () => {
				const [hit, miss] = makeTracks('air/hit.flac', 'air/miss.flac')
				const root = new FakeDirectoryHandle('Music')
				const air = await root.getDirectoryHandle('air', { create: true })
				air.children.set('hit.flac', new FakeFileHandle('hit.flac'))
				internals().handle = root
				internals().state = 'connected'

				await localLibrary.check(hit)
				await localLibrary.check(miss)

				expect(localLibrary.isLocal(hit)).toBe(true)
				expect(localLibrary.isLocal(miss)).toBe(false)
			})
		})

		describe('Firefox', () => {
			it('resolves against the file map and caches results', async () => {
				const [present, absent] = makeTracks(
					'air/present.flac',
					'air/gone.flac'
				)
				const lib = internals()
				lib.fileMap = new Map([[present.path ?? '', new File([], 'p.flac')]])
				lib.state = 'connected'

				await localLibrary.check(present)
				await localLibrary.check(absent)

				expect(localLibrary.isLocal(present)).toBe(true)
				expect(localLibrary.isLocal(absent)).toBe(false)

				// results are cached: mutating the source afterwards changes nothing
				lib.fileMap.delete(present.path)
				await localLibrary.check(present)
				expect(localLibrary.isLocal(present)).toBe(true)
			})
		})
	})

	describe('getURL()', () => {
		it('returns null without a track/path or while disconnected', async () => {
			const [track] = makeTracks('air/a.flac')

			expect(await localLibrary.getURL(undefined)).toBeNull()
			expect(await localLibrary.getURL({ id: 2 } as Track)).toBeNull()
			expect(await localLibrary.getURL(track)).toBeNull()
		})

		it('creates a blob URL from a Firefox file-map entry, null if absent', async () => {
			const [track, missing] = makeTracks('air/a.flac', 'air/nope.flac')
			internals().fileMap = new Map([
				[track.path ?? '', new File(['abc'], 'a.flac')]
			])
			internals().state = 'connected'

			const url = await localLibrary.getURL(track)
			expect(url).toMatch(/^blob:/)
			URL.revokeObjectURL(url ?? '')
			expect(await localLibrary.getURL(missing)).toBeNull()
		})

		it('reads through the Chrome handle and returns null when missing', async () => {
			const [hit, miss] = makeTracks('air/hit.flac', 'air/miss.flac')
			const root = new FakeDirectoryHandle('Music')
			const air = await root.getDirectoryHandle('air', { create: true })
			air.children.set('hit.flac', new FakeFileHandle('hit.flac'))
			internals().handle = root
			internals().state = 'connected'

			const url = await localLibrary.getURL(hit)
			expect(url).toMatch(/^blob:/)
			URL.revokeObjectURL(url ?? '')
			expect(await localLibrary.getURL(miss)).toBeNull()
		})
	})

	describe('getURL()', () => {
		it('returns null without a track/path or while disconnected', async () => {
			const [track] = makeTracks('air/a.flac')

			expect(await localLibrary.getURL(undefined)).toBeNull()
			expect(await localLibrary.getURL({ id: 2 } as Track)).toBeNull()
			expect(await localLibrary.getURL(track)).toBeNull()
		})

		describe('Chrome', () => {
			it('reads through the handle and returns null when missing', async () => {
				const [hit, miss] = makeTracks('air/hit.flac', 'air/miss.flac')
				const root = new FakeDirectoryHandle('Music')
				const air = await root.getDirectoryHandle('air', { create: true })
				air.children.set('hit.flac', new FakeFileHandle('hit.flac'))
				internals().handle = root
				internals().state = 'connected'

				const url = await localLibrary.getURL(hit)
				expect(url).toMatch(/^blob:/)
				URL.revokeObjectURL(url ?? '')
				expect(await localLibrary.getURL(miss)).toBeNull()
			})
		})

		describe('Firefox', () => {
			it('creates a blob URL from a file-map entry, null if absent', async () => {
				const [track, missing] = makeTracks('air/a.flac', 'air/nope.flac')
				internals().fileMap = new Map([
					[track.path ?? '', new File(['abc'], 'a.flac')]
				])
				internals().state = 'connected'

				const url = await localLibrary.getURL(track)
				expect(url).toMatch(/^blob:/)
				URL.revokeObjectURL(url ?? '')
				expect(await localLibrary.getURL(missing)).toBeNull()
			})
		})
	})

	describe('saveToDevice()', () => {
		describe('Chrome', () => {
			it('streams into the stored handle without opening the picker when readwrite is granted', async () => {
				setPicker(async () => {
					throw new Error('picker must not open')
				})
				const root = new FakeDirectoryHandle('Music')
				internals().handle = root
				const [track] = makeTracks('air/(1998) Moon Safari/01 la femme.flac')

				const progress: { done: number; total: number }[] = []
				for await (const p of localLibrary.saveToDevice([track])) {
					progress.push(p)
				}

				expect(progress).toEqual([{ done: 1, total: 1 }])
				expect(fetchedUrls).toEqual(['//tracks/1/data'])
				const air = root.children.get('air') as FakeDirectoryHandle | undefined
				const album = air?.children.get('(1998) Moon Safari') as
					| FakeDirectoryHandle
					| undefined
				expect(album?.children.has('01 la femme.flac')).toBe(true)
			})

			it('falls back to the directory picker when the stored permission lapsed', async () => {
				let pickerOptions: unknown
				setPicker(async opts => {
					pickerOptions = opts
					return new FakeDirectoryHandle('Picked')
				})
				const stale = new FakeDirectoryHandle('Music')
				stale.permission = 'prompt'
				internals().handle = stale
				const [track] = makeTracks('x/y.flac')

				for await (const _ of localLibrary.saveToDevice([track])) {
					// drain progress
				}

				expect(pickerOptions).toEqual({ mode: 'readwrite', startIn: 'music' })
				const picked = internals().handle as FakeDirectoryHandle
				expect(picked.name).toBe('Picked')
				const x = picked.children.get('x') as FakeDirectoryHandle | undefined
				expect(x?.children.has('y.flac')).toBe(true)
			})

			it('skips tracks that fail to download but saves the rest', async () => {
				setPicker(async () => {
					throw new Error('picker must not open')
				})
				const root = new FakeDirectoryHandle('Music')
				internals().handle = root
				const [ok, failing] = makeTracks('a/ok.flac', 'a/bad.flac')
				const previousHandler = fetchHandler
				fetchHandler = url =>
					url.endsWith(`/tracks/${failing.id}/data`)
						? new Response(null, { status: 500 })
						: previousHandler(url)

				const progress: { done: number; total: number }[] = []
				for await (const p of localLibrary.saveToDevice([ok, failing])) {
					progress.push(p)
				}

				expect(progress).toEqual([{ done: 1, total: 2 }])
				const a = root.children.get('a') as FakeDirectoryHandle | undefined
				expect(a?.children.has('ok.flac')).toBe(true)
				expect(a?.children.has('bad.flac')).toBe(false)
			})

			it('re-checks availability after saving so pins update immediately', async () => {
				setPicker(async () => {
					throw new Error('picker must not open')
				})
				const root = new FakeDirectoryHandle('Music')
				internals().handle = root
				const [track] = makeTracks('air/live.flac')
				internals().availability.set(track.path ?? '', false)

				for await (const _ of localLibrary.saveToDevice([track])) {
					// drain progress
				}
				await flushMacrotasks()

				expect(localLibrary.isLocal(track)).toBe(true)
			})
		})

		describe('Firefox', () => {
			it('bundles tracks into one zip named after the selected folder', async () => {
				const [t1, t2] = makeTracks(
					'air/(1998) Moon Safari/01.flac',
					'air/(1998) Moon Safari/02.flac'
				)
				internals().folder = 'My Music'

				const progress: { done: number; total: number }[] = []
				for await (const p of localLibrary.saveToDevice([t1, t2])) {
					progress.push(p)
				}

				expect(progress).toEqual([
					{ done: 1, total: 2 },
					{ done: 2, total: 2 }
				])
				expect(fetchedUrls).toEqual(['//tracks/1/data', '//tracks/2/data'])
				expect(downloads).toEqual(['My Music.zip'])
			})

			it('sanitizes unsafe characters of the folder name', async () => {
				const [track] = makeTracks('a/b.flac')
				internals().folder = 'AC/DC: Best "Of"'

				const progress: { done: number; total: number }[] = []
				for await (const p of localLibrary.saveToDevice([track])) {
					progress.push(p)
				}

				expect(progress).toEqual([{ done: 1, total: 1 }])
				expect(downloads).toEqual(['AC-DC- Best -Of-.zip'])
			})

			it('still delivers a zip containing only successfully fetched tracks', async () => {
				const [ok, failing] = makeTracks('a/ok.flac', 'a/fail.flac')
				internals().folder = 'My Music'
				const previousHandler = fetchHandler
				fetchHandler = url =>
					url.endsWith(`/tracks/${failing.id}/data`)
						? new Response(null, { status: 500 })
						: previousHandler(url)

				const progress: { done: number; total: number }[] = []
				for await (const p of localLibrary.saveToDevice([ok, failing])) {
					progress.push(p)
				}

				expect(progress).toEqual([{ done: 1, total: 2 }])
				expect(downloads).toEqual(['My Music.zip'])
			})

			it('downloads nothing when no track can be fetched', async () => {
				const [track] = makeTracks('a/x.flac')
				internals().folder = 'My Music'
				fetchHandler = () => new Response(null, { status: 500 })

				const progress: { done: number; total: number }[] = []
				for await (const p of localLibrary.saveToDevice([track])) {
					progress.push(p)
				}

				expect(progress).toEqual([])
				expect(downloads).toEqual([])
			})
		})
	})
})
