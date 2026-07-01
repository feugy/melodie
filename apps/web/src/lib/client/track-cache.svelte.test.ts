import {
	afterAll,
	beforeEach,
	describe,
	expect,
	it,
	mock,
	spyOn
} from 'bun:test'
import { makeTrack } from '$lib/tests/factories'
import type { Agent } from '@melodie/common/models'
import { TrackCache } from './track-cache.svelte'

describe('track cache', () => {
	const fetch = spyOn(globalThis, 'fetch')
	const createObjectURL = spyOn(URL, 'createObjectURL')
	let rootDirectory: MockDirectoryHandle
	let storage: { getDirectory: ReturnType<typeof mock> }
	let cache: TrackCache

	beforeEach(() => {
		rootDirectory = new MockDirectoryHandle()
		storage = {
			getDirectory: mock(async () => rootDirectory)
		}
		fetch.mockReset()
		createObjectURL.mockReset()
		createObjectURL.mockReturnValue('blob:cached-track')
		Object.defineProperty(navigator, 'storage', {
			value: storage,
			configurable: true
		})
		cache = new TrackCache(512)
	})

	afterAll(() => {
		fetch.mockRestore()
		createObjectURL.mockRestore()
	})

	describe('addToCache()', () => {
		it('preloads data', async () => {
			const agent: Agent = { id: 9, name: 'a', base: 'https://agent.test' }
			const track = makeTrack({ id: 33, agentId: agent.id })
			cache.setAgentById(new Map([[agent.id, agent]]))
			fetch.mockResolvedValue(makeSizedResponse(16))

			const promise = cache.addToCache(track)
			expect(promise).toBeInstanceOf(Promise)
			await promise
			expect(fetch).toHaveBeenCalledTimes(1)
			expect(fetch).toHaveBeenCalledWith('https://agent.test/tracks/33/data')
		})

		it('deduplicates concurrent preloads for the same track', async () => {
			const agent: Agent = { id: 19, name: 'a', base: 'https://agent.test' }
			const track = makeTrack({ id: 66, agentId: agent.id })
			cache.setAgentById(new Map([[agent.id, agent]]))
			fetch.mockResolvedValue(makeSizedResponse(18))

			await Promise.all([cache.addToCache(track), cache.addToCache(track)])

			expect(fetch).toHaveBeenCalledTimes(1)
			expect(fetch).toHaveBeenCalledWith('https://agent.test/tracks/66/data')
		})

		it('resolves to undefined when preload is skipped', async () => {
			await expect(cache.addToCache(undefined)).resolves.toBeUndefined()
			expect(fetch).not.toHaveBeenCalled()
		})
	})

	describe('getTrackURLAndCache()', () => {
		it('returns remote url immediately and starts background caching', async () => {
			const agent: Agent = { id: 20, name: 'a', base: 'https://agent.test' }
			const track = makeTrack({ id: 67, agentId: agent.id })
			cache.setAgentById(new Map([[agent.id, agent]]))
			fetch.mockResolvedValue(makeSizedResponse(12))

			expect(cache.getTrackURLAndCache(track)).toBe(
				'https://agent.test/tracks/67/data'
			)

			await cache.addToCache(track)
			expect(fetch).toHaveBeenCalledTimes(1)
		})

		it('returns undefined without track', () => {
			expect(cache.getTrackURLAndCache(undefined)).toBeUndefined()
			expect(fetch).not.toHaveBeenCalled()
		})
	})

	describe('readCachedTrack()', () => {
		it('returns undefined when track is not cached', async () => {
			const agent: Agent = { id: 23, name: 'a', base: 'https://agent.test' }
			const track = makeTrack({ id: 70, agentId: agent.id })
			cache.setAgentById(new Map([[agent.id, agent]]))

			expect(await cache.readCachedTrack(track)).toBeUndefined()
			expect(fetch).not.toHaveBeenCalled()
		})

		it('returns object url from cache without fetching again', async () => {
			const agent: Agent = { id: 24, name: 'a', base: 'https://agent.test' }
			const track = makeTrack({ id: 71, agentId: agent.id })
			cache.setAgentById(new Map([[agent.id, agent]]))
			fetch.mockResolvedValue(makeSizedResponse(26))

			await cache.addToCache(track)
			fetch.mockClear()

			expect(await cache.readCachedTrack(track)).toBe('blob:cached-track')
			expect(fetch).not.toHaveBeenCalled()
		})
	})
})

class MockFile {
	size: number
	lastModified: number

	constructor(size: number, lastModified: number) {
		this.size = size
		this.lastModified = lastModified
	}
}

class MockFileHandle {
	kind = 'file' as const
	private data = new Uint8Array(0)
	private modified = Date.now()

	async createWritable() {
		const chunks: Uint8Array[] = []
		return new WritableStream<Uint8Array>({
			write: chunk => {
				chunks.push(chunk)
			},
			close: () => {
				this.data = concatChunks(chunks)
				this.modified = Date.now()
			}
		})
	}

	async getFile() {
		return new MockFile(this.data.byteLength, this.modified)
	}
}

class MockDirectoryHandle {
	private files = new Map<string, MockFileHandle>()
	private directories = new Map<string, MockDirectoryHandle>()

	async getDirectoryHandle(name: string, options?: { create?: boolean }) {
		const existing = this.directories.get(name)
		if (existing) return existing
		if (!options?.create) {
			throw new Error(`Directory not found: ${name}`)
		}
		const created = new MockDirectoryHandle()
		this.directories.set(name, created)
		return created
	}

	async getFileHandle(name: string, options?: { create?: boolean }) {
		const existing = this.files.get(name)
		if (existing) return existing
		if (!options?.create) {
			throw new Error(`File not found: ${name}`)
		}
		const created = new MockFileHandle()
		this.files.set(name, created)
		return created
	}

	async removeEntry(name: string) {
		this.files.delete(name)
	}

	async *entries() {
		for (const entry of this.files.entries()) {
			yield entry
		}
	}
}

function concatChunks(chunks: Uint8Array[]) {
	const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0)
	const result = new Uint8Array(totalLength)
	let offset = 0
	for (const chunk of chunks) {
		result.set(chunk, offset)
		offset += chunk.byteLength
	}
	return result
}

function makeSizedResponse(bits: number) {
	return new Response(new Uint8Array(bits), {
		headers: { 'content-length': `${bits}` }
	})
}
