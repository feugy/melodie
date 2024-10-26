// @vitest-environment jsdom

import { faker } from '@faker-js/faker'
import type { Track } from '@melodie/common/models'
import { addRefs } from '@melodie/common/tests'
import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import SortableList from './sortable-list.test.svelte'

describe('SortableList component', () => {
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

		render(SortableList, { items })

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

		const onmove = vi.fn()
		const pageYGetter = vi.fn()
		// JSDom does not support setting pageY, we have do do it ourselve
		Object.defineProperty(MouseEvent.prototype, 'pageY', {
			enumerable: true,
			get: pageYGetter
		})

		beforeEach(async () => {
			render(SortableList, { items, onmove })
			vi.resetAllMocks()
			pageYGetter.mockReturnValue(0)
		})

		it('drags track forward in the list', async () => {
			const dragged = screen.getByText(items[1].tags.title as string)
			const hovered = screen.getByText(items[2].tags.title as string)
			const dropped = screen.getByText(items[3].tags.title as string)

			let pageY = 0
			pageYGetter.mockImplementation(() => ++pageY)
			const pointerName = 'TouchA'

			await userEvent.pointer([
				{ target: dragged, keys: `[${pointerName}>]` },
				{ target: dragged, pointerName },
				{ target: hovered, pointerName },
				{ target: dropped, pointerName },
				{ keys: `[/${pointerName}]` }
			])

			expect(onmove).toHaveBeenCalledWith({ from: 1, to: 3 })
			expect(onmove).toHaveBeenCalledOnce()
		})

		it('drags track backward in the list', async () => {
			const dragged = screen.getByText(items[3].tags.title as string)
			const hovered = screen.getByText(items[2].tags.title as string)
			const dropped = screen.getByText(items[1].tags.title as string)

			let pageY = 100
			pageYGetter.mockImplementation(() => --pageY)
			const pointerName = 'TouchA'

			await userEvent.pointer([
				{ target: dragged, keys: `[${pointerName}>]` },
				{ target: dragged, pointerName },
				{ target: hovered, pointerName },
				{ target: dropped, pointerName },
				{ keys: `[/${pointerName}]` }
			])

			expect(onmove).toHaveBeenCalledWith({ from: 3, to: 1 })
			expect(onmove).toHaveBeenCalledOnce()
		})

		it('drags track at the very end', async () => {
			const dragged = screen.getByText(items[0].tags.title as string)
			const hoveredFirst = screen.getByText(items[1].tags.title as string)
			const hoveredLast = screen.getByText(items[4].tags.title as string)

			let pageY = 0
			pageYGetter.mockImplementation(() => ++pageY)
			const pointerName = 'TouchA'

			await userEvent.pointer([
				{ target: dragged, keys: `[${pointerName}>]` },
				{ target: hoveredFirst, pointerName },
				{ target: hoveredLast, pointerName },
				{ keys: `[/${pointerName}]` }
			])

			expect(onmove).toHaveBeenCalledWith({ from: 0, to: 4 })
			expect(onmove).toHaveBeenCalledOnce()
		})

		it('drags track at the very beginning', async () => {
			const dragged = screen.getByText(items[3].tags.title as string)
			const hoveredFirst = screen.getByText(items[2].tags.title as string)
			const hoveredLast = screen.getByText(items[0].tags.title as string)

			let pageY = 100
			pageYGetter.mockImplementation(() => --pageY)
			const pointerName = 'TouchA'
			await userEvent.pointer([
				{ target: dragged, keys: `[${pointerName}>]` },
				{ target: hoveredFirst, pointerName },
				{ target: hoveredLast, pointerName },
				{ keys: `[/${pointerName}]` }
			])

			expect(onmove).toHaveBeenCalledWith({ from: 3, to: 0 })
			expect(onmove).toHaveBeenCalledOnce()
		})

		it('does not move track clicks', async () => {
			const dragged = screen.getByText(items[2].tags.title as string)

			await userEvent.click(dragged)
			expect(onmove).not.toHaveBeenCalled()
		})
	})
})
