import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	mock
} from 'bun:test'
import { faker } from '@faker-js/faker'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import type { Track } from '@melodie/common/models'
import { addRefs } from '@melodie/common/tests'
import { render } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import SortableList from './sortable-list.test.svelte'

describe('SortableList component', () => {
	beforeAll(() => {
		GlobalRegistrator.register()
	})

	afterAll(() => GlobalRegistrator.unregister())

	it('allows duplicated items', async () => {
		const track1: Pick<Track, 'id' | 'tags'> = addRefs({
			id: 1,
			tags: {
				title: faker.music.songName(),
				artists: [faker.music.artist()],
				genre: [],
				duration: 0
			},
			media: faker.system.fileName()
		})
		const track2: Pick<Track, 'id' | 'tags'> = addRefs({
			id: 2,
			tags: {
				title: faker.music.songName(),
				artists: [faker.music.artist()],
				genre: [],
				duration: 0
			},
			media: faker.system.fileName()
		})
		const items = [track1, track2, track1]

		const screen = render(SortableList, { items })

		expect(screen.getAllByText(track1.tags.title as string)).toHaveLength(2)
		expect(screen.getByText(track2.tags.title as string)).toBeInTheDocument()
	})

	describe('given a list of items', () => {
		const items: Pick<Track, 'id' | 'tags'>[] = [
			{
				id: 1,
				tags: {
					title: faker.music.songName() + 1,
					artists: [faker.music.artist()],
					genre: [],
					duration: 0
				},
				media: faker.system.fileName()
			},
			{
				id: 2,
				tags: {
					title: faker.music.songName() + 2,
					artists: [faker.music.artist()],
					genre: [],
					duration: 0
				},
				media: faker.system.fileName()
			},
			{
				id: 3,
				tags: {
					title: faker.music.songName() + 3,
					artists: [faker.music.artist()],
					genre: [],
					duration: 0
				},
				media: faker.system.fileName()
			},
			{
				id: 4,
				tags: {
					title: faker.music.songName() + 4,
					artists: [faker.music.artist()],
					genre: [],
					duration: 0
				},
				media: faker.system.fileName()
			},
			{
				id: 5,
				tags: {
					title: faker.music.songName() + 5,
					artists: [faker.music.artist()],
					genre: [],
					duration: 0
				},
				media: faker.system.fileName()
			}
		].map(addRefs)

		const pointerName = 'TouchA'
		const onmove = mock()
		let screen: ReturnType<typeof render>

		beforeEach(async () => {
			screen = render(SortableList, { items, onmove })
			onmove.mockReset()
		})

		it('drags track forward in the list', async () => {
			const dragged = screen.getByText(items[1].tags.title) as Element
			const hovered = screen.getByText(items[2].tags.title) as Element
			const dropped = screen.getByText(items[3].tags.title) as Element

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

			expect(onmove).toHaveBeenCalledWith({ from: 1, to: 3 })
			expect(onmove).toHaveBeenCalledTimes(1)
		})

		it('drags track backward in the list', async () => {
			const dragged = screen.getByText(items[3].tags.title) as Element
			const hovered = screen.getByText(items[2].tags.title) as Element
			const dropped = screen.getByText(items[1].tags.title) as Element

			await userEvent.pointer(
				[
					{
						target: dragged,
						keys: `[${pointerName}>]`,
						coords: { pageY: 300 }
					},
					{ target: hovered, pointerName, coords: { pageY: 200 } },
					{ target: dropped, pointerName, coords: { pageY: 100 } },
					{ keys: `[/${pointerName}]` }
				],
				{ document }
			)

			expect(onmove).toHaveBeenCalledWith({ from: 3, to: 1 })
			expect(onmove).toHaveBeenCalledTimes(1)
		})

		it('drags track at the very end', async () => {
			const dragged = screen.getByText(items[0].tags.title) as Element
			const hoveredFirst = screen.getByText(items[1].tags.title) as Element
			const hoveredLast = screen.getByText(items[4].tags.title) as Element

			await userEvent.pointer(
				[
					{
						target: dragged,
						keys: `[${pointerName}>]`,
						coords: { pageY: 100 }
					},
					{ target: hoveredFirst, pointerName, coords: { pageY: 200 } },
					{ target: hoveredLast, pointerName, coords: { pageY: 300 } },
					{ keys: `[/${pointerName}]` }
				],
				{ document }
			)

			expect(onmove).toHaveBeenCalledWith({ from: 0, to: 4 })
			expect(onmove).toHaveBeenCalledTimes(1)
		})

		it('drags track at the very beginning', async () => {
			const dragged = screen.getByText(items[3].tags.title) as Element
			const hoveredFirst = screen.getByText(items[2].tags.title) as Element
			const hoveredLast = screen.getByText(items[0].tags.title) as Element

			await userEvent.pointer(
				[
					{
						target: dragged,
						keys: `[${pointerName}>]`,
						coords: { pageY: 300 }
					},
					{ target: hoveredFirst, pointerName, coords: { pageY: 200 } },
					{ target: hoveredLast, pointerName, coords: { pageY: 0 } },
					{ keys: `[/${pointerName}]` }
				],
				{ document }
			)

			expect(onmove).toHaveBeenCalledWith({ from: 3, to: 0 })
			expect(onmove).toHaveBeenCalledTimes(1)
		})

		it('does not move track clicks', async () => {
			const dragged = screen.getByText(items[2].tags.title) as Element

			await userEvent.click(dragged)
			expect(onmove).not.toHaveBeenCalled()
		})
	})
})
