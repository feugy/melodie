import {
	afterAll,
	beforeEach,
	describe,
	expect,
	it,
	mock,
	spyOn
} from 'bun:test'
import { base } from '$app/paths'
import { makeTrack } from '$lib/tests/factories'
import type { Track } from '@melodie/common/models'
import localforage from 'localforage'
import {
	contentStorageKey,
	currentStorageKey,
	trackQueue
} from './track-queue.svelte'

describe('track queue', () => {
	const fetch = spyOn(globalThis, 'fetch')

	const tracks = Array.from({ length: 10 }, (_, i) => makeTrack({ id: i + 1 }))

	afterAll(() => {
		fetch.mockRestore()
	})

	beforeEach(async () => {
		fetch.mockReset()
		fetch.mockResolvedValue(Response.json({ total: 0, data: [] }))
		await localforage.dropInstance()
		await trackQueue.init()
		fetch.mockClear()
	})

	describe('init()', () => {
		it('reads local content and checks against with server', async () => {
			const index = 2
			await localforage.setItem(contentStorageKey, tracks)
			await localforage.setItem(currentStorageKey, index)
			fetch.mockResolvedValueOnce(
				Response.json({ total: tracks.length, data: tracks })
			)

			await trackQueue.init()

			expect(trackQueue.content).toEqual(tracks)
			expect(trackQueue.current).toEqual(tracks[index])
			expect(trackQueue.index).toBe(index)
			expect(trackQueue.length).toBe(tracks.length)
			expect(trackQueue.isLast).toBe(false)
			expect(fetch).toHaveBeenCalledWith(`${base}/api/get-tracks`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ids: tracks.map(({ id }) => id) })
			})
		})

		it.each([
			{ index: -1 },
			{ index: 30 },
			{ index: false },
			{ index: 'invalid' }
		])('resets index when local value is $index', async ({ index }) => {
			await localforage.setItem(contentStorageKey, tracks)
			await localforage.setItem(currentStorageKey, index)
			fetch.mockResolvedValueOnce(
				Response.json({ total: tracks.length, data: tracks })
			)

			await trackQueue.init()

			expect(trackQueue.content).toEqual(tracks)
			expect(trackQueue.current).toEqual(tracks[0])
			expect(trackQueue.index).toBe(0)
		})

		it.each([{ tracks: false }, { tracks: 'invalid' }, { tracks: [] }])(
			'reset tracks when local value is $tracks ',
			async ({ tracks: localTracks }) => {
				await localforage.setItem(contentStorageKey, localTracks)
				await localforage.setItem(currentStorageKey, 2)

				await trackQueue.init()

				expect(trackQueue.content).toEqual([])
				expect(trackQueue.current).toBeUndefined()
				expect(trackQueue.index).toBeNull()
				expect(fetch).not.toHaveBeenCalled()
			}
		)

		it('skips invalid local tracks when checking server', async () => {
			await localforage.setItem(contentStorageKey, [
				tracks[0],
				{},
				false,
				'not a track',
				null,
				undefined,
				tracks[1]
			])
			await localforage.setItem(currentStorageKey, 2)
			const data = tracks.slice(0, 2)
			fetch.mockResolvedValueOnce(Response.json({ total: data.length, data }))

			await trackQueue.init()

			expect(trackQueue.content).toEqual(data)
			expect(trackQueue.current).toEqual(tracks[0])
			expect(trackQueue.index).toBe(0)
			expect(fetch).toHaveBeenCalledWith(`${base}/api/get-tracks`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ids: data.map(({ id }) => id) })
			})
			expect(fetch).toHaveBeenCalledTimes(1)
		})

		it('skips local content not confirmed by server', async () => {
			const index = 7
			await localforage.setItem(contentStorageKey, tracks)
			await localforage.setItem(currentStorageKey, index)
			fetch.mockResolvedValueOnce(
				Response.json({ total: 4, data: tracks.slice(0, 4) })
			)

			await trackQueue.init()

			expect(trackQueue.content).toEqual(tracks.slice(0, 4))
			expect(trackQueue.current).toEqual(tracks[0])
			expect(trackQueue.index).toBe(0)
			expect(fetch).toHaveBeenCalledWith(`${base}/api/get-tracks`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ids: tracks.map(({ id }) => id) })
			})
			expect(fetch).toHaveBeenCalledTimes(1)
		})

		it('can skip server check', async () => {
			const index = 3
			await localforage.setItem(contentStorageKey, tracks)
			await localforage.setItem(currentStorageKey, index)

			await trackQueue.init(false)

			expect(trackQueue.content).toEqual(tracks)
			expect(trackQueue.current).toEqual(tracks[index])
			expect(trackQueue.index).toBe(index)
			expect(fetch).not.toHaveBeenCalled()
		})

		it('skips server checks without local content', async () => {
			await localforage.setItem(contentStorageKey, [])
			await localforage.setItem(currentStorageKey, null)

			await trackQueue.init()

			expect(trackQueue.content).toEqual([])
			expect(trackQueue.current).toBeUndefined()
			expect(trackQueue.index).toBeNull()
			expect(fetch).not.toHaveBeenCalled()
		})
	})

	it('is empty', async () => {
		expect(trackQueue.content).toEqual([])
		expect(trackQueue.current).toBeUndefined()
		expect(trackQueue.nextTrack).toBeUndefined()
		expect(trackQueue.index).toBeNull()
		expect(trackQueue.length).toBe(0)
		expect(trackQueue.isLast).toBe(true)
		expect(fetch).not.toHaveBeenCalled()
	})

	it('can not play next on empty queue', async () => {
		await trackQueue.playNext()
		expect(trackQueue.content).toEqual([])
		expect(trackQueue.current).toBeUndefined()
		expect(trackQueue.nextTrack).toBeUndefined()
		expect(trackQueue.index).toBeNull()
	})

	it('can not play previous on empty queue', async () => {
		await trackQueue.playPrevious()
		expect(trackQueue.content).toEqual([])
		expect(trackQueue.current).toBeUndefined()
		expect(trackQueue.nextTrack).toBeUndefined()
		expect(trackQueue.index).toBeNull()
	})

	it('can not remove on empty queue', async () => {
		await trackQueue.removeAt(2)
		expect(trackQueue.content).toEqual([])
		expect(trackQueue.current).toBeUndefined()
		expect(trackQueue.nextTrack).toBeUndefined()
		expect(trackQueue.index).toBeNull()
	})

	it('can not jump on empty queue', async () => {
		await trackQueue.jumpTo(2)
		expect(trackQueue.content).toEqual([])
		expect(trackQueue.current).toBeUndefined()
		expect(trackQueue.nextTrack).toBeUndefined()
		expect(trackQueue.index).toBeNull()
	})

	it('can not move on empty queue', async () => {
		await trackQueue.move({ from: 1, to: 2 })
		expect(trackQueue.content).toEqual([])
		expect(trackQueue.current).toBeUndefined()
		expect(trackQueue.nextTrack).toBeUndefined()
		expect(trackQueue.index).toBeNull()
	})

	it('can not clear an empty queue', async () => {
		await trackQueue.clear()
		expect(trackQueue.content).toEqual([])
		expect(trackQueue.current).toBeUndefined()
		expect(trackQueue.nextTrack).toBeUndefined()
		expect(trackQueue.index).toBeNull()
	})

	it('can not shuffle an empty queue', async () => {
		await trackQueue.shuffle()
		expect(trackQueue.content).toEqual([])
		expect(trackQueue.current).toBeUndefined()
		expect(trackQueue.nextTrack).toBeUndefined()
		expect(trackQueue.index).toBeNull()
		expect(trackQueue.shuffled).toBe(false)
	})

	describe('add()', () => {
		it('adds tracks', async () => {
			const [t1, t2, t3] = tracks
			await trackQueue.add([t1, t2, t3])
			expect(trackQueue.content).toEqual([t1, t2, t3])
			expect(trackQueue.current).toEqual(t1)
			expect(trackQueue.index).toBe(0)
			expect(trackQueue.length).toBe(3)
			expect(trackQueue.isLast).toBe(false)
			await expectStoredList()
		})

		it('can change current track upon addition', async () => {
			const [t1, t2, t3] = tracks
			await trackQueue.add([t1])
			expect(trackQueue.current).toEqual(t1)
			await trackQueue.add([t2, t3])
			expect(trackQueue.content).toEqual([t1, t2, t3])
			expect(trackQueue.current).toEqual(t2)
			expect(trackQueue.index).toBe(1)
			expect(trackQueue.length).toBe(3)
			expect(trackQueue.isLast).toBe(false)
			await expectStoredList()
		})

		it('can keep current track upon addition', async () => {
			const [t1, t2, t3] = tracks
			await trackQueue.add([t1])
			expect(trackQueue.current).toEqual(t1)
			await trackQueue.add([t2, t3], { play: false })
			expect(trackQueue.content).toEqual([t1, t2, t3])
			expect(trackQueue.current).toEqual(t1)
			expect(trackQueue.index).toBe(0)
			expect(trackQueue.length).toBe(3)
			expect(trackQueue.isLast).toBe(false)
			await expectStoredList()
		})

		it('can replace previous tracks', async () => {
			const [t1, t2, t3, t4] = tracks
			await trackQueue.add([t1, t2])
			await trackQueue.add([t3, t2, t4], { replace: true })
			expect(trackQueue.content).toEqual([t3, t2, t4])
			expect(trackQueue.current).toEqual(t3)
			expect(trackQueue.index).toBe(0)
			expect(trackQueue.length).toBe(3)
			expect(trackQueue.isLast).toBe(false)
			await expectStoredList()
		})

		it('sets current when adding the first track', async () => {
			const [t1] = tracks
			await trackQueue.add([t1], { play: false })
			expect(trackQueue.content).toEqual([t1])
			expect(trackQueue.current).toEqual(t1)
			expect(trackQueue.nextTrack).toEqual(t1)
			expect(trackQueue.index).toBe(0)
			expect(trackQueue.length).toBe(1)
			expect(trackQueue.isLast).toBe(true)
			await expectStoredList()
		})
	})

	describe('playNext()', () => {
		it('plays the next tracks', async () => {
			await trackQueue.add(tracks.slice(0, 3))
			await trackQueue.playNext()
			expect(trackQueue.current).toEqual(tracks[1])
			expect(trackQueue.index).toBe(1)
			await trackQueue.playNext()
			expect(trackQueue.current).toEqual(tracks[2])
			expect(trackQueue.index).toBe(2)
			expect(trackQueue.length).toBe(3)
			expect(trackQueue.isLast).toBe(true)
			await expectStoredList()
		})

		it('circles back to first', async () => {
			await trackQueue.add(tracks.slice(0, 2))
			await trackQueue.playNext()
			expect(trackQueue.current).toEqual(tracks[1])
			expect(trackQueue.index).toBe(1)
			await trackQueue.playNext()
			expect(trackQueue.current).toEqual(tracks[0])
			expect(trackQueue.index).toBe(0)
			expect(trackQueue.length).toBe(2)
			expect(trackQueue.isLast).toBe(false)
			await expectStoredList()
		})

		it('supports duplicates', async () => {
			const [t1] = tracks
			await trackQueue.add([t1, t1, t1])
			expect(trackQueue.current).toEqual(t1)
			expect(trackQueue.index).toBe(0)
			await trackQueue.playNext()
			expect(trackQueue.current).toEqual(t1)
			expect(trackQueue.index).toBe(1)
			await trackQueue.playNext()
			expect(trackQueue.current).toEqual(t1)
			expect(trackQueue.index).toBe(2)
			expect(trackQueue.length).toBe(3)
			expect(trackQueue.isLast).toBe(true)
			await expectStoredList()
		})

		it('can register and unregister auto-next listeners', async () => {
			await trackQueue.add(tracks.slice(0, 3))
			const listener = mock()
			const unsubscribe = trackQueue.registerAutoNextListener(listener)
			await trackQueue.playNext(true)
			expect(trackQueue.current).toEqual(tracks[1])
			expect(listener).toHaveBeenCalledTimes(1)
			await trackQueue.playNext(true)
			expect(listener).toHaveBeenCalledTimes(2)
			unsubscribe()
			await trackQueue.playNext(true)
			expect(listener).toHaveBeenCalledTimes(2)
		})

		it('notifies all listeners', async () => {
			const listener1 = mock()
			const listener2 = mock()
			trackQueue.registerAutoNextListener(listener1)
			trackQueue.registerAutoNextListener(listener2)
			await trackQueue.add(tracks.slice(0, 3))
			await trackQueue.playNext(true)
			expect(trackQueue.current).toEqual(tracks[1])
			expect(listener1).toHaveBeenCalledTimes(1)
			expect(listener2).toHaveBeenCalledTimes(1)
			await trackQueue.playNext()
			expect(trackQueue.current).toEqual(tracks[2])
			expect(listener1).toHaveBeenCalledTimes(1)
			expect(listener2).toHaveBeenCalledTimes(1)
		})
	})

	describe('playPrevious()', () => {
		it('plays the previous track', async () => {
			await trackQueue.add(tracks.slice(0, 3))
			await trackQueue.playNext()
			await trackQueue.playNext()
			await trackQueue.playPrevious()
			expect(trackQueue.current).toEqual(tracks[1])
			expect(trackQueue.index).toBe(1)
			await trackQueue.playPrevious()
			expect(trackQueue.current).toEqual(tracks[0])
			expect(trackQueue.index).toBe(0)
			expect(trackQueue.length).toBe(3)
			expect(trackQueue.isLast).toBe(false)
			await expectStoredList()
		})

		it('circles back to last', async () => {
			await trackQueue.add(tracks.slice(0, 2))
			await trackQueue.playPrevious()
			expect(trackQueue.current).toEqual(tracks[1])
			expect(trackQueue.index).toBe(1)
			expect(trackQueue.length).toBe(2)
			expect(trackQueue.isLast).toBe(true)
			await expectStoredList()
		})

		it('supports duplicates', async () => {
			const [t1] = tracks
			await trackQueue.add([t1, t1, t1])
			expect(trackQueue.current).toEqual(t1)
			expect(trackQueue.index).toBe(0)
			await trackQueue.playPrevious()
			expect(trackQueue.current).toEqual(t1)
			expect(trackQueue.index).toBe(2)
			await trackQueue.playPrevious()
			expect(trackQueue.current).toEqual(t1)
			expect(trackQueue.index).toBe(1)
			expect(trackQueue.length).toBe(3)
			expect(trackQueue.isLast).toBe(false)
			await expectStoredList()
		})
	})

	describe('removeAt()', () => {
		beforeEach(async () => {
			await trackQueue.add(tracks.slice(0, 3))
		})

		it('removes the last track', async () => {
			await trackQueue.removeAt(2)
			expect(trackQueue.content).toEqual(tracks.slice(0, 2))
			expect(trackQueue.current).toEqual(tracks[0])
			expect(trackQueue.index).toBe(0)
			expect(trackQueue.length).toBe(2)
			expect(trackQueue.isLast).toBe(false)
			await expectStoredList()
		})

		it('removes the first track', async () => {
			await trackQueue.removeAt(0)
			expect(trackQueue.content).toEqual(tracks.slice(1, 3))
			expect(trackQueue.current).toEqual(tracks[1])
			expect(trackQueue.index).toBe(0)
			expect(trackQueue.length).toBe(2)
			expect(trackQueue.isLast).toBe(false)
			await expectStoredList()
		})

		it('removes current track', async () => {
			const [t1, t2, t3] = tracks
			await trackQueue.playNext()
			expect(trackQueue.current).toEqual(t2)
			expect(trackQueue.index).toBe(1)
			await trackQueue.removeAt(1)
			expect(trackQueue.content).toEqual([t1, t3])
			expect(trackQueue.current).toEqual(t3)
			expect(trackQueue.index).toBe(1)
			expect(trackQueue.length).toBe(2)
			expect(trackQueue.isLast).toBe(true)
			await expectStoredList()
		})

		it('removes forward track', async () => {
			await trackQueue.add(tracks.slice(3, 4), { play: false })
			await trackQueue.removeAt(1)
			await trackQueue.removeAt(1)
			expect(trackQueue.content).toEqual([tracks[0], tracks[3]])
			expect(trackQueue.current).toEqual(tracks[0])
			expect(trackQueue.index).toBe(0)
			expect(trackQueue.length).toBe(2)
			expect(trackQueue.isLast).toBe(false)
			await expectStoredList()
		})

		it('removes backward track', async () => {
			await trackQueue.add(tracks.slice(3, 4), { play: false })
			await trackQueue.playPrevious()
			expect(trackQueue.index).toBe(3)
			await trackQueue.removeAt(0)
			expect(trackQueue.index).toBe(2)
			await trackQueue.removeAt(1)
			expect(trackQueue.index).toBe(1)
			expect(trackQueue.current).toEqual(tracks[3])
			expect(trackQueue.content).toEqual([tracks[1], tracks[3]])
			expect(trackQueue.length).toBe(2)
			expect(trackQueue.isLast).toBe(true)
			await expectStoredList()
		})

		it('ignores out of band indices', async () => {
			await trackQueue.jumpTo(-2)
			await trackQueue.jumpTo(-1)
			await trackQueue.jumpTo(10)
			await trackQueue.jumpTo(50)
			expect(trackQueue.content).toEqual(tracks.slice(0, 3))
			expect(trackQueue.current).toEqual(tracks[0])
			expect(trackQueue.index).toBe(0)
			await expectStoredList()
		})
	})

	describe('clear()', () => {
		it('drops all tracks', async () => {
			await trackQueue.add(tracks.slice(0, 2))
			await trackQueue.playNext()
			expect(trackQueue.index).toBe(1)
			expect(trackQueue.current).toEqual(tracks[1])
			await trackQueue.clear()
			expect(trackQueue.current).toBeUndefined()
			expect(trackQueue.index).toBeNull()
			expect(trackQueue.length).toBe(0)
			expect(trackQueue.isLast).toBe(true)
			await expectStoredList()
		})
	})

	describe('jump()', () => {
		beforeEach(async () => {
			await trackQueue.add(tracks.slice(0, 4))
		})

		it('plays forward tracks', async () => {
			await trackQueue.jumpTo(2)
			expect(trackQueue.current).toEqual(tracks[2])
			expect(trackQueue.index).toBe(2)
			expect(trackQueue.isLast).toBe(false)
			await trackQueue.jumpTo(3)
			expect(trackQueue.current).toEqual(tracks[3])
			expect(trackQueue.index).toBe(3)
			expect(trackQueue.isLast).toBe(true)
			await expectStoredList()
		})

		it('plays backward tracks', async () => {
			await trackQueue.playPrevious()
			await trackQueue.jumpTo(2)
			expect(trackQueue.current).toEqual(tracks[2])
			expect(trackQueue.index).toBe(2)
			expect(trackQueue.isLast).toBe(false)
			await trackQueue.jumpTo(0)
			expect(trackQueue.current).toEqual(tracks[0])
			expect(trackQueue.index).toBe(0)
			expect(trackQueue.isLast).toBe(false)
			await expectStoredList()
		})

		it('supports duplicates', async () => {
			await trackQueue.clear()
			const [t1] = tracks
			await trackQueue.add([t1, t1, t1])
			expect(trackQueue.current).toEqual(t1)
			expect(trackQueue.index).toBe(0)
			expect(trackQueue.isLast).toBe(false)
			await trackQueue.jumpTo(2)
			expect(trackQueue.current).toEqual(t1)
			expect(trackQueue.index).toBe(2)
			expect(trackQueue.isLast).toBe(true)
			await trackQueue.jumpTo(1)
			expect(trackQueue.current).toEqual(t1)
			expect(trackQueue.index).toBe(1)
			expect(trackQueue.isLast).toBe(false)
			await expectStoredList()
		})

		it('ignores out of band indices', async () => {
			await trackQueue.jumpTo(-2)
			await trackQueue.jumpTo(-1)
			await trackQueue.jumpTo(10)
			await trackQueue.jumpTo(50)
			expect(trackQueue.current).toEqual(tracks[0])
			expect(trackQueue.index).toBe(0)
			await expectStoredList()
		})
	})

	describe('move()', () => {
		beforeEach(async () => {
			await trackQueue.add(tracks.slice(0, 5))
			await trackQueue.jumpTo(2)
		})

		it('moves track before current one', async () => {
			await trackQueue.move({ from: 3, to: 0 })

			expect(trackQueue.content).toEqual([
				tracks[3],
				tracks[0],
				tracks[1],
				tracks[2],
				tracks[4]
			])
			expect(trackQueue.index).toEqual(3)
			expect(trackQueue.current).toEqual(tracks[2])
			expect(trackQueue.length).toBe(5)
			expect(trackQueue.isLast).toBe(false)
			await expectStoredList()
		})

		it('moves track backward, after current', async () => {
			await trackQueue.move({ from: 3, to: 4 })

			expect(trackQueue.content).toEqual([
				tracks[0],
				tracks[1],
				tracks[2],
				tracks[4],
				tracks[3]
			])
			expect(trackQueue.current).toEqual(tracks[2])
			expect(trackQueue.index).toEqual(2)
			expect(trackQueue.length).toBe(5)
			expect(trackQueue.isLast).toBe(false)
			await expectStoredList()
		})

		it('moves track forward, after current', async () => {
			await trackQueue.move({ from: 3, to: 4 })

			expect(trackQueue.content).toEqual([
				tracks[0],
				tracks[1],
				tracks[2],
				tracks[4],
				tracks[3]
			])
			expect(trackQueue.current).toEqual(tracks[2])
			expect(trackQueue.index).toEqual(2)
			expect(trackQueue.length).toBe(5)
			expect(trackQueue.isLast).toBe(false)
			await expectStoredList()
		})

		it('moves track backward, before current', async () => {
			await trackQueue.move({ from: 1, to: 0 })

			expect(trackQueue.content).toEqual([
				tracks[1],
				tracks[0],
				tracks[2],
				tracks[3],
				tracks[4]
			])
			expect(trackQueue.current).toEqual(tracks[2])
			expect(trackQueue.index).toEqual(2)
			expect(trackQueue.length).toBe(5)
			expect(trackQueue.isLast).toBe(false)
			await expectStoredList()
		})

		it('moves track forward, after current', async () => {
			await trackQueue.move({ from: 0, to: 1 })

			expect(trackQueue.content).toEqual([
				tracks[1],
				tracks[0],
				tracks[2],
				tracks[3],
				tracks[4]
			])
			expect(trackQueue.current).toEqual(tracks[2])
			expect(trackQueue.index).toEqual(2)
			expect(trackQueue.length).toBe(5)
			expect(trackQueue.isLast).toBe(false)
			await expectStoredList()
		})

		it('moves track after current one', async () => {
			await trackQueue.move({ from: 0, to: 3 })

			expect(trackQueue.content).toEqual([
				tracks[1],
				tracks[2],
				tracks[3],
				tracks[0],
				tracks[4]
			])
			expect(trackQueue.current).toEqual(tracks[2])
			expect(trackQueue.index).toEqual(1)
			expect(trackQueue.length).toBe(5)
			expect(trackQueue.isLast).toBe(false)
			await expectStoredList()
		})

		it('moves current track forward', async () => {
			await trackQueue.move({ from: 2, to: 3 })

			expect(trackQueue.content).toEqual([
				tracks[0],
				tracks[1],
				tracks[3],
				tracks[2],
				tracks[4]
			])
			expect(trackQueue.current).toEqual(tracks[2])
			expect(trackQueue.index).toEqual(3)
			expect(trackQueue.length).toBe(5)
			expect(trackQueue.isLast).toBe(false)
			await expectStoredList()
		})

		it('moves current track backward', async () => {
			await trackQueue.move({ from: 2, to: 0 })

			expect(trackQueue.content).toEqual([
				tracks[2],
				tracks[0],
				tracks[1],
				tracks[3],
				tracks[4]
			])
			expect(trackQueue.current).toEqual(tracks[2])
			expect(trackQueue.index).toEqual(0)
			expect(trackQueue.length).toBe(5)
			expect(trackQueue.isLast).toBe(false)
			await expectStoredList()
		})

		it.each([
			{ from: -1, to: 2 },
			{ from: 20, to: 2 },
			{ from: 2, to: -1 },
			{ from: 2, to: 20 },
			{ from: 2, to: 2 }
		])('ignores inalid move %o', async ({ from, to }) => {
			await trackQueue.move({ from, to })
			expect(trackQueue.content).toEqual(tracks.slice(0, 5))
			expect(trackQueue.current).toEqual(tracks[2])
			expect(trackQueue.index).toEqual(2)
			await expectStoredList()
		})
	})

	describe('shuffle()', () => {
		beforeEach(async () => {
			await trackQueue.add(tracks)
			await trackQueue.jumpTo(2)
		})

		const order = [...tracks.map(({ id }) => id)]

		const added = Array.from({ length: 4 }, (_, i) =>
			makeTrack({ id: i + tracks.length })
		)

		it('randomizes the order of all tracks when turned on', async () => {
			const currentId = trackQueue.current?.id
			expect(currentId).toBeDefined()
			expect(trackQueue.shuffled).toBe(false)
			expect(trackQueue.content.map(({ id }) => id)).toEqual(order)

			await trackQueue.shuffle()

			// @ts-expect-error -- currentId is defined, so TS doesn't like to compare with current?.id
			expect(trackQueue.current?.id).toEqual(currentId)
			expect(trackQueue.content.map(({ id }) => id)).not.toEqual(order)
			expect(trackQueue.index).toEqual(0)
			expect(trackQueue.shuffled).toBe(true)
			await expectStoredList()
		})

		it('reverts to original order, keeping current track', async () => {
			await trackQueue.shuffle()
			await trackQueue.playNext()
			await trackQueue.playNext()
			const currentId = trackQueue.current?.id
			expect(currentId).toBeDefined()
			expect(trackQueue.index).toEqual(2)

			await trackQueue.shuffle()

			expect(trackQueue.content.map(({ id }) => id)).toEqual(order)
			// @ts-expect-error -- currentId is defined, so TS doesn't like to compare with current?.id
			expect(trackQueue.current?.id).toEqual(currentId)
			expect(trackQueue.shuffled).toBe(false)
			await expectStoredList()
		})

		it('does not retain removed tracks upon unshuffling', async () => {
			await trackQueue.shuffle()
			await trackQueue.jumpTo(2)
			await trackQueue.removeAt(6)
			expect(trackQueue.index).toEqual(2)
			await trackQueue.removeAt(1)
			expect(trackQueue.index).toEqual(1)
			const currentId = trackQueue.current?.id
			const removed = difference(
				order,
				trackQueue.content.map(({ id }) => id)
			)
			expect(removed).toHaveLength(2)

			await trackQueue.shuffle()
			expect(trackQueue.content).toHaveLength(tracks.length - removed.length)
			expect(trackQueue.content.map(({ id }) => id)).toEqual(
				order.filter(id => !removed.includes(id))
			)
			// @ts-expect-error -- currentId is defined, so TS doesn't like to compare with current?.id
			expect(trackQueue.current?.id).toEqual(currentId)
			expect(trackQueue.shuffled).toBe(false)
			await expectStoredList()
		})

		it('stays cleared after unshuffling', async () => {
			await trackQueue.shuffle()

			await trackQueue.clear()

			expect(trackQueue.content).toEqual([])
			expect(trackQueue.current).toBeUndefined()
			expect(trackQueue.index).toBeNull()
			expect(trackQueue.shuffled).toBe(true)

			await trackQueue.shuffle()

			expect(trackQueue.content).toEqual([])
			expect(trackQueue.current).toBeUndefined()
			expect(trackQueue.index).toBeNull()
			expect(trackQueue.shuffled).toBe(false)
		})

		it('restores moved track to their original position upon unshuffling', async () => {
			await trackQueue.shuffle()
			await trackQueue.jumpTo(3)
			const content = [...trackQueue.content]
			await trackQueue.move({ from: 1, to: 6 })
			expect(trackQueue.index).toEqual(2)
			const currentId = trackQueue.current?.id
			expect(trackQueue.content).toEqual([
				content[0],
				...content.slice(2, 7),
				content[1],
				...content.slice(7)
			])

			await trackQueue.shuffle()

			expect(trackQueue.content.map(({ id }) => id)).toEqual(order)
			// @ts-expect-error -- currentId is defined, so TS doesn't like to compare with current?.id
			expect(trackQueue.current?.id).toEqual(currentId)
			expect(trackQueue.shuffled).toBe(false)
			await expectStoredList()
		})

		it('adds new tracks at random position', async () => {
			await trackQueue.shuffle()
			await trackQueue.jumpTo(3)
			expect(trackQueue.index).toEqual(3)
			const currentId = trackQueue.current?.id

			await trackQueue.add(added, { play: false })

			expect(trackQueue.index).toEqual(3)
			// @ts-expect-error -- currentId is defined, so TS doesn't like to compare with current?.id
			expect(trackQueue.current?.id).toEqual(currentId)
			expect(trackQueue.content).toHaveLength(tracks.length + added.length)
			const content = trackQueue.content.map(({ id }) => id)
			expect(content.slice(tracks.length)).not.toEqual(
				added.map(({ id }) => id)
			)
			for (const { id } of added) {
				expect(content).toContain(id)
			}
			expect(trackQueue.shuffled).toBe(true)
			await expectStoredList()
		})

		it('keeps added tracks at the end upon unshuffling', async () => {
			await trackQueue.shuffle()
			await trackQueue.jumpTo(3)
			expect(trackQueue.index).toEqual(3)
			const currentId = trackQueue.current?.id
			await trackQueue.add(added)
			expect(trackQueue.index).toEqual(3)

			await trackQueue.shuffle()

			expect(trackQueue.content).toHaveLength(tracks.length + added.length)
			expect(trackQueue.content.map(({ id }) => id)).toEqual([
				...order,
				...added.map(({ id }) => id)
			])
			// @ts-expect-error -- currentId is defined, so TS doesn't like to compare with current?.id
			expect(trackQueue.current?.id).toEqual(currentId)
			expect(trackQueue.shuffled).toBe(false)
			await expectStoredList()
		})

		it('adds randomized tracks to empty shuffled list', async () => {
			await trackQueue.shuffle()
			await trackQueue.clear()
			expect(trackQueue.index).toBeNull()

			await trackQueue.add(added)

			expect(trackQueue.index).toEqual(0)
			expect(trackQueue.content).toHaveLength(added.length)
			const content = trackQueue.content.map(({ id }) => id)
			expect(content.slice(tracks.length)).not.toEqual(
				added.map(({ id }) => id)
			)
			expect(trackQueue.shuffled).toBe(true)
			await expectStoredList()
		})
	})

	function difference<T>(...arrays: T[][]): T[] {
		return arrays.reduce((a, b) => a.filter(c => !b.includes(c)))
	}

	async function expectStoredList() {
		expect(await localforage.getItem<Track[]>(contentStorageKey)).toEqual(
			trackQueue.content
		)
		expect(
			await localforage.getItem<number | undefined>(currentStorageKey)
		).toEqual(trackQueue.index)

		const expectedNextTrack =
			trackQueue.content.length === 0
				? undefined
				: trackQueue.content[
						(trackQueue.index ?? 0) >= trackQueue.content.length - 1
							? 0
							: (trackQueue.index ?? 0) + 1
					]
		expect(trackQueue.nextTrack).toEqual(expectedNextTrack)
	}
})
