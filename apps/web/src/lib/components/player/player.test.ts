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
import { MD, screen, trackCache } from '$lib/client'
import { makeAgentById, makeTrack } from '$lib/tests/factories'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { render } from '@testing-library/svelte'
import { type Component, tick } from 'svelte'
import Button from '../button/button.svelte'
import type { PlayerProps } from './player.svelte'
import type PlayerType from './player.svelte'

type Deferred<T> = {
	promise: Promise<T>
	resolve: (value: T) => void
}

const goto = mock(async () => void 0)
const invalidate = mock(async () => void 0)
mock.module('$app/navigation', () => ({ goto, invalidate }))
mock.module('$app/environment', () => ({ browser: true }))
mock.module('$lib/components/add-to-playlist/add-to-playlist.svelte', () => ({
	default: Button
}))

describe('Player component', () => {
	const agentById = makeAgentById()
	const onnext = mock()
	const onprevious = mock()
	const onshuffle = mock()
	const onplaylistopen = mock()
	let Player: Component<PlayerProps>
	let playSpy: ReturnType<typeof spyOn>

	beforeAll(async () => {
		GlobalRegistrator.register()
		Player = (await import('./player.svelte')) as unknown as typeof PlayerType
		playSpy = spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(
			() => {
				return Promise.resolve()
			}
		)
	})

	afterAll(() => {
		playSpy.mockRestore()
		GlobalRegistrator.unregister()
	})

	beforeEach(() => {
		onnext.mockClear()
		onprevious.mockClear()
		onshuffle.mockClear()
		onplaylistopen.mockClear()
		playSpy.mockClear()
		screen.size = MD
		screen.supportHover = true
	})

	it('switches src immediately without waiting for cache reads', async () => {
		const getTrackURLAndCacheSpy = spyOn(
			trackCache,
			'getTrackURLAndCache'
		).mockImplementation(track =>
			track ? `https://agent.test/tracks/${track.id}/data` : undefined
		)
		const readCachedTrackSpy = spyOn(
			trackCache,
			'readCachedTrack'
		).mockResolvedValue(undefined)
		const firstTrack = makeTrack({ id: 1, agentId: 1 })
		const secondTrack = makeTrack({ id: 2, agentId: 1 })

		const { getByTestId, rerender } = render(Player, {
			agentById,
			track: firstTrack,
			isLast: false,
			isShuffled: false,
			isTrackListOpen: false,
			onnext,
			onprevious,
			onshuffle,
			onplaylistopen
		})
		const audio = getByTestId('audio-player') as HTMLAudioElement
		await flushEffects()

		expect(audio.src).toContain('/tracks/1/data')

		rerender({
			agentById,
			track: secondTrack,
			isLast: false,
			isShuffled: false,
			isTrackListOpen: false,
			onnext,
			onprevious,
			onshuffle,
			onplaylistopen
		})
		await flushEffects()

		expect(audio.src).toContain('/tracks/2/data')
		expect(getTrackURLAndCacheSpy).toHaveBeenCalledTimes(2)
		expect(readCachedTrackSpy).toHaveBeenCalledTimes(2)
		expect(playSpy).toHaveBeenCalled()
		getTrackURLAndCacheSpy.mockRestore()
		readCachedTrackSpy.mockRestore()
	})

	it('ignores stale cache resolution after rapid track switches', async () => {
		const deferredByTrackId = new Map<number, Deferred<string | undefined>>()
		const getTrackURLAndCacheSpy = spyOn(trackCache, 'getTrackURLAndCache')
		const readCachedTrackSpy = spyOn(
			trackCache,
			'readCachedTrack'
		).mockImplementation(track => {
			if (!track) {
				return Promise.resolve(undefined)
			}
			return getOrCreateDeferred(deferredByTrackId, track.id).promise
		})
		const firstTrack = makeTrack({ id: 11, agentId: 1 })
		const secondTrack = makeTrack({ id: 12, agentId: 1 })

		const { getByTestId, rerender } = render(Player, {
			agentById,
			track: firstTrack,
			isLast: false,
			isShuffled: false,
			isTrackListOpen: false,
			onnext,
			onprevious,
			onshuffle,
			onplaylistopen
		})
		const audio = getByTestId('audio-player') as HTMLAudioElement
		await flushEffects()

		rerender({
			agentById,
			track: secondTrack,
			isLast: false,
			isShuffled: false,
			isTrackListOpen: false,
			onnext,
			onprevious,
			onshuffle,
			onplaylistopen
		})
		await flushEffects()
		expect(audio.src).toBe('')

		getOrCreateDeferred(deferredByTrackId, firstTrack.id).resolve(
			'blob:stale-track'
		)
		await flushEffects()
		expect(audio.src).toBe('')

		getOrCreateDeferred(deferredByTrackId, secondTrack.id).resolve(
			'blob:current-track'
		)
		await flushEffects()
		expect(audio.src).toContain('blob:current-track')

		expect(getTrackURLAndCacheSpy).not.toHaveBeenCalled()
		getTrackURLAndCacheSpy.mockRestore()
		readCachedTrackSpy.mockRestore()
	})
})

function getOrCreateDeferred<T>(map: Map<number, Deferred<T>>, id: number) {
	let deferred = map.get(id)
	if (!deferred) {
		let resolve: ((value: T) => void) | undefined
		const promise = new Promise<T>(res => {
			resolve = res
		})
		deferred = {
			promise,
			resolve: value => resolve?.(value)
		}
		map.set(id, deferred)
	}
	return deferred
}

async function flushEffects() {
	await Promise.resolve()
	await tick()
}
