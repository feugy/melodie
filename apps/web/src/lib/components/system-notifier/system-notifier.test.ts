import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	mock
} from 'bun:test'
import { makeAgentById } from '$lib/tests/factories'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { render } from '@testing-library/svelte'
import { type Component, tick } from 'svelte'
import { disksData } from '../disks-list/disks-list.testdata'
import type { SystemNotifierProps } from './system-notifier.svelte'
import type SystemNotifierType from './system-notifier.svelte'

describe('SystemNotifier Component', () => {
	const onnext = mock()
	const onprevious = mock()
	const agentById = makeAgentById()
	let SystemNotifier: Component<SystemNotifierProps, { notify: () => void }>
	let component: SystemNotifierType
	let rerender: ReturnType<typeof render>['rerender']
	const handlersByType = new Map<string, null | (() => unknown)>()

	beforeAll(async () => {
		GlobalRegistrator.register()
		// @ts-ignore -- HappyDOM does not support mediaSession
		navigator.mediaSession = {
			setActionHandler: (type: string, handler: null | (() => unknown)) => {
				handlersByType.set(type, handler)
			}
		}
		// @ts-ignore -- HappyDOM does not support MediaMetadata
		window.MediaMetadata = mock().mockImplementation(arg => arg)
		SystemNotifier = (await import(
			'./system-notifier.svelte'
		)) as unknown as typeof SystemNotifierType
	})

	afterAll(() => GlobalRegistrator.unregister())

	beforeEach(() => {
		onnext.mockClear()
		onprevious.mockClear()
	})

	describe('given a platform without Notification', () => {
		beforeEach(() => {
			// @ts-ignore -- HappyDOM does not support Notification
			window.Notification = null
			;({ component, rerender } = render(SystemNotifier, {
				agentById,
				onnext,
				onprevious
			}))
		})

		it('does nothing on notify', async () => {
			expect(() => component.notify(disksData[0])).not.toThrow()
			await tick()
			expect(onnext).not.toHaveBeenCalled()
			expect(onprevious).not.toHaveBeenCalled()
		})

		it('updates metadata on track change', async () => {
			const [track] = disksData
			rerender({ track })
			await tick()
			expect(navigator.mediaSession.metadata).toEqual(
				new MediaMetadata({
					// biome-ignore lint/style/noNonNullAssertion: this ref does exist
					album: track.albumRef![1]!,
					// biome-ignore lint/style/noNonNullAssertion: this ref does exist
					artist: track.artistRefs![0][1]!,
					title: track.tags.title,
					artwork: []
				})
			)
		})
	})

	describe('given no permission granted', () => {
		beforeEach(() => {
			// @ts-ignore -- HappyDOM does not support Notification
			window.Notification = mock()
			Notification.requestPermission = mock().mockResolvedValue('denied')
			;({ component, rerender } = render(SystemNotifier, {
				agentById,
				onnext,
				onprevious
			}))
		})

		it('does nothing on notify', async () => {
			expect(() => component.notify(disksData[0])).not.toThrow()
			await tick()
			expect(Notification).not.toHaveBeenCalled()
			expect(onnext).not.toHaveBeenCalled()
			expect(onprevious).not.toHaveBeenCalled()
		})

		it('updates metadata on track change', async () => {
			const [, , track] = disksData
			rerender({ track })
			await tick()
			expect(navigator.mediaSession.metadata).toEqual(
				new MediaMetadata({
					// biome-ignore lint/style/noNonNullAssertion: this ref does exist
					album: track.albumRef![1]!,
					// biome-ignore lint/style/noNonNullAssertion: this ref does exist
					artist: track.artistRefs![0][1]!,
					title: track.tags.title,
					artwork: []
				})
			)
		})
	})

	describe('given granted permission', () => {
		const [, track] = disksData

		beforeEach(async () => {
			// @ts-ignore -- HappyDOM does not support Notification
			window.Notification = mock()
			Notification.requestPermission = mock().mockResolvedValue('granted')
			;({ component, rerender } = render(SystemNotifier, {
				track,
				agentById,
				onnext,
				onprevious
			}))
			await tick()
			// @ts-ignore -- this is a mock
			MediaMetadata.mockClear()
		})

		it('triggers a notification on notify', async () => {
			expect(() => component.notify(track)).not.toThrow()
			await tick()
			expect(Notification).toHaveBeenCalledTimes(1)
			expect(Notification).toHaveBeenCalledWith(track.tags.title, {
				body: `${track.artistRefs?.[0][1]} - ${track.albumRef?.[1]}`,
				silent: true
			})
			expect(onnext).not.toHaveBeenCalled()
			expect(onprevious).not.toHaveBeenCalled()
		})

		it('updates metadata on track change', async () => {
			const [track] = disksData
			rerender({ track })
			await tick()
			expect(navigator.mediaSession.metadata).toEqual({
				// biome-ignore lint/style/noNonNullAssertion: this ref does exist
				album: track.albumRef![1]!,
				// biome-ignore lint/style/noNonNullAssertion: this ref does exist
				artist: track.artistRefs![0][1]!,
				// biome-ignore lint/style/noNonNullAssertion: this title does exist
				title: track.tags.title!,
				artwork: []
			})
			expect(MediaMetadata).toHaveBeenCalledTimes(1)
			expect(onnext).not.toHaveBeenCalled()
			expect(onprevious).not.toHaveBeenCalled()
		})

		it('does not update metadata without track', async () => {
			rerender({ track: undefined })
			await tick()
			expect(MediaMetadata).not.toHaveBeenCalled()
			expect(onnext).not.toHaveBeenCalled()
			expect(onprevious).not.toHaveBeenCalled()
		})

		it('binds metadata next track to onnext', async () => {
			handlersByType.get('nexttrack')?.()
			await tick()
			expect(MediaMetadata).not.toHaveBeenCalled()
			expect(onnext).toHaveBeenCalledTimes(1)
			expect(onprevious).not.toHaveBeenCalled()
		})

		it('binds metadata previous track to onprevious', async () => {
			rerender({ track: undefined })
			await tick()
			handlersByType.get('previoustrack')?.()
			await tick()
			expect(MediaMetadata).not.toHaveBeenCalled()
			expect(onprevious).toHaveBeenCalledTimes(1)
			expect(onnext).not.toHaveBeenCalled()
		})
	})
})
