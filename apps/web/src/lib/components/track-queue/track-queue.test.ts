import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	mock
} from 'bun:test'
import { screen as screenState } from '$lib/client'
import { makeAgentById, makeTrack } from '$lib/tests/factories'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import type { Track } from '@melodie/common/models'
import { render } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import TracksQueue from './track-queue.svelte'

describe('TrackQueue component', () => {
	const agentById = makeAgentById()
	const onmove = mock()
	const onplay = mock()
	const onremove = mock()
	let screen: ReturnType<typeof render>

	beforeAll(() => {
		GlobalRegistrator.register()
	})

	afterAll(() => GlobalRegistrator.unregister())

	const tracks = [
		makeTrack({ id: 1 }),
		makeTrack({ id: 2 }),
		makeTrack({ id: 3 }),
		makeTrack({ id: 4 })
	]

	function expectListItems(tracks: Track[]) {
		expect(
			(screen.queryAllByRole('listitem') as HTMLElement[]).map(
				node => node.textContent
			)
		).toEqual(
			tracks.map(({ tags: { title } }) => expect.stringContaining(title ?? ''))
		)
	}

	beforeEach(async () => {
		screenState.supportHover = true
		screen = render(TracksQueue, {
			agentById,
			tracks,
			currentIdx: 1,
			onmove,
			onplay,
			onremove
		})
		onplay.mockClear()
		onmove.mockClear()
		onremove.mockClear()
	})

	it('can play track on click', async () => {
		const newTrack = tracks[2]
		await userEvent.click(screen.getByText(newTrack.tags.title) as HTMLElement)

		expectListItems(tracks)
		expect(onplay).toHaveBeenCalledWith(2)
		expect(onplay).toHaveBeenCalledTimes(1)
		expect(onmove).not.toHaveBeenCalled()
		expect(onremove).not.toHaveBeenCalled()
	})

	it('can remove track on button click', async () => {
		const index = 1
		await userEvent.click(
			screen.getByTestId(`remove-track-${index}`) as HTMLButtonElement
		)

		expect(onremove).toHaveBeenCalledWith(index)
		expect(onremove).toHaveBeenCalledTimes(1)
		expect(onmove).not.toHaveBeenCalled()
		expect(onplay).not.toHaveBeenCalled()
	})

	it('can reorders tracks in the list', async () => {
		expectListItems(tracks)

		const dragged = screen.queryByText(tracks[0].tags.title) as HTMLElement
		const hovered = screen.queryByText(tracks[2].tags.title) as HTMLElement
		const dropped = screen.queryByText(tracks[3].tags.title) as HTMLElement

		const pointerName = 'TouchA'
		await userEvent.pointer(
			[
				{
					target: dragged,
					keys: `[${pointerName}>]`,
					coords: { pageY: 100 }
				},
				{ target: dragged, pointerName, coords: { pageY: 200 } },
				{ target: hovered, pointerName, coords: { pageY: 300 } },
				{ target: dropped, pointerName, coords: { pageY: 400 } },
				{ keys: `[/${pointerName}]` }
			],
			{ document }
		)

		expect(onmove).toHaveBeenCalledWith({ from: 0, to: 3 })
		expect(onmove).toHaveBeenCalledTimes(1)
		expect(onremove).not.toHaveBeenCalled()
		expect(onplay).not.toHaveBeenCalled()
	})
})
