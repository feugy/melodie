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

	describe('getData()', () => {
		it('returns undefined without track', async () => {
			expect(await cache.getData(undefined)).toBeUndefined()
			expect(fetch).not.toHaveBeenCalled()
		})

		it('falls back to remote url when no agent base exists', async () => {
			const track = makeTrack({ id: 1, agentId: 11 })
			expect(await cache.getData(track)).toBeUndefined()
			expect(fetch).not.toHaveBeenCalled()
		})

		it('downloads once and returns object urls', async () => {
			const agent: Agent = { id: 7, name: 'a', base: 'https://agent.test' }
			const track = makeTrack({ id: 14, agentId: agent.id })
			cache.agentById.set(agent.id, agent)

			fetch.mockResolvedValue(makeSizedResponse(32))

			const first = await cache.getData(track)
			const second = await cache.getData(track)

			expect(first).toBe('blob:cached-track')
			expect(second).toBe('blob:cached-track')
			expect(fetch).toHaveBeenCalledTimes(1)
			expect(fetch).toHaveBeenCalledWith('https://agent.test/tracks/14/data')
			expect(createObjectURL).toHaveBeenCalledTimes(2)
		})

		it('falls back to remote url when download fails', async () => {
			const agent: Agent = { id: 8, name: 'a', base: 'https://agent.test' }
			const track = makeTrack({ id: 22, agentId: agent.id })
			cache.agentById.set(agent.id, agent)
			fetch.mockResolvedValue(new Response(null, { status: 500 }))

			expect(await cache.getData(track)).toBe(
				'https://agent.test/tracks/22/data'
			)
			expect(fetch).toHaveBeenCalledTimes(1)
			expect(createObjectURL).not.toHaveBeenCalled()
		})

		it('evicts oldest track when cache is full', async () => {
			const agent: Agent = { id: 10, name: 'a', base: 'https://agent.test' }
			const firstTrack = makeTrack({ id: 100, agentId: agent.id })
			const secondTrack = makeTrack({ id: 101, agentId: agent.id })
			cache.agentById.set(agent.id, agent)

			fetch
				.mockResolvedValueOnce(makeSizedResponse(300))
				.mockResolvedValueOnce(makeSizedResponse(300))
				.mockResolvedValueOnce(makeSizedResponse(300))

			await cache.getData(firstTrack)
			await cache.getData(secondTrack)

			fetch.mockClear()

			await cache.getData(secondTrack)
			expect(fetch).not.toHaveBeenCalled()

			await cache.getData(firstTrack)
			expect(fetch).toHaveBeenCalledTimes(1)
			expect(fetch).toHaveBeenCalledWith('https://agent.test/tracks/100/data')
		})
	})

	describe('loadData()', () => {
		it('preloads data', async () => {
			const agent: Agent = { id: 9, name: 'a', base: 'https://agent.test' }
			const track = makeTrack({ id: 33, agentId: agent.id })
			cache.agentById.set(agent.id, agent)
			fetch.mockResolvedValue(makeSizedResponse(16))

			const promise = cache.loadData(track)
			expect(promise).toBeInstanceOf(Promise)
			await promise
			expect(fetch).toHaveBeenCalledTimes(1)
			expect(fetch).toHaveBeenCalledWith('https://agent.test/tracks/33/data')
		})

		it('resolves to undefined when preload is skipped', async () => {
			await expect(cache.loadData(undefined)).resolves.toBeUndefined()
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
