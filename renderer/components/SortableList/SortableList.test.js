'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import { get } from 'svelte/store'
import html from 'svelte-htm'
import faker from 'faker'
import { isMoveInProgress } from './SortableList.svelte'
import SortableList from './SortableList.stories.svelte'
import { addRefs } from '../../tests'

describe('SortableList component', () => {
  it('allows duplicated items', async () => {
    const track1 = addRefs({
      id: 1,
      tags: {
        title: faker.commerce.productName(),
        artists: [faker.name.findName()]
      },
      media: faker.system.fileName()
    })
    const track2 = addRefs({
      id: 2,
      tags: {
        title: faker.commerce.productName(),
        artists: [faker.name.findName()]
      },
      media: faker.system.fileName()
    })
    const items = [track1, track2, track1]

    render(html`<${SortableList} items=${items} />`)

    expect(screen.getAllByText(track1.tags.title)).toHaveLength(2)
    expect(screen.getAllByText(track2.tags.title)).toHaveLength(1)
  })

  describe('given a list of items', () => {
    const items = [
      {
        id: 1,
        tags: {
          title: faker.commerce.productName(),
          artists: [faker.name.findName()]
        },
        media: faker.system.fileName()
      },
      {
        id: 2,
        tags: {
          title: faker.commerce.productName(),
          artists: [faker.name.findName()]
        },
        media: faker.system.fileName()
      },
      {
        id: 3,
        tags: {
          title: faker.commerce.productName(),
          artists: [faker.name.findName()]
        },
        media: faker.system.fileName()
      },
      {
        id: 4,
        tags: {
          title: faker.commerce.productName(),
          artists: [faker.name.findName()]
        },
        media: faker.system.fileName()
      },
      {
        id: 5,
        tags: {
          title: faker.commerce.productName(),
          artists: [faker.name.findName()]
        },
        media: faker.system.fileName()
      }
    ].map(addRefs)

    const onMove = jest.fn()

    beforeEach(async () => {
      render(
        html`<p data-testid="paragraph">fake drop</p>
          <${SortableList} items=${items} on:move=${onMove} />`
      )
      jest.resetAllMocks()
    })

    it('drags track forward in the list', async () => {
      expect(get(isMoveInProgress)).toBe(false)
      const dragged = screen.queryByText(items[1].tags.title)
      const hovered = screen.queryByText(items[2].tags.title)
      const dropped = screen.queryByText(items[3].tags.title)

      await fireEvent.mouseDown(dragged)
      await fireEvent.mouseMove(dragged)
      expect(get(isMoveInProgress)).toBe(true)
      await fireEvent.mouseEnter(hovered.closest('li'))
      await fireEvent.mouseEnter(dropped.closest('li'))
      await fireEvent.mouseUp(dropped)

      expect(get(isMoveInProgress)).toBe(false)
      expect(onMove).toHaveBeenCalledWith(
        expect.objectContaining({ detail: { from: 1, to: 2 } })
      )
      expect(onMove).toHaveBeenCalledTimes(1)
    })

    it('drags track backward in the list', async () => {
      expect(get(isMoveInProgress)).toBe(false)
      const dragged = screen.queryByText(items[3].tags.title)
      const hovered = screen.queryByText(items[2].tags.title)
      const dropped = screen.queryByText(items[1].tags.title)

      await fireEvent.mouseDown(dragged)
      await fireEvent.mouseMove(dragged)
      expect(get(isMoveInProgress)).toBe(true)
      await fireEvent.mouseEnter(hovered.closest('li'))
      await fireEvent.mouseEnter(dropped.closest('li'))
      await fireEvent.mouseUp(dropped)

      expect(get(isMoveInProgress)).toBe(false)
      expect(onMove).toHaveBeenCalledWith(
        expect.objectContaining({ detail: { from: 3, to: 1 } })
      )
      expect(onMove).toHaveBeenCalledTimes(1)
    })

    it('drags track at the very end', async () => {
      expect(get(isMoveInProgress)).toBe(false)
      const dragged = screen.queryByText(items[0].tags.title)
      const hovered = screen.queryByText(items[4].tags.title)

      await fireEvent.mouseDown(dragged)
      await fireEvent.mouseMove(dragged)
      expect(get(isMoveInProgress)).toBe(true)
      await fireEvent.mouseEnter(hovered.closest('li'))
      await fireEvent.mouseLeave(hovered.closest('ol'))
      await fireEvent.mouseUp(dragged)

      expect(get(isMoveInProgress)).toBe(false)
      expect(onMove).toHaveBeenCalledWith(
        expect.objectContaining({ detail: { from: 0, to: 4 } })
      )
      expect(onMove).toHaveBeenCalledTimes(1)
    })

    it('drags track at the very beginning', async () => {
      expect(get(isMoveInProgress)).toBe(false)
      const dragged = screen.queryByText(items[1].tags.title)
      const hovered = screen.queryByText(items[0].tags.title)

      await fireEvent.mouseDown(dragged)
      await fireEvent.mouseMove(dragged)
      expect(get(isMoveInProgress)).toBe(true)
      await fireEvent.mouseEnter(hovered.closest('li'))
      await fireEvent.mouseLeave(hovered.closest('ol'))
      await fireEvent.mouseUp(dragged)

      expect(get(isMoveInProgress)).toBe(false)
      expect(onMove).toHaveBeenCalledWith(
        expect.objectContaining({ detail: { from: 1, to: 0 } })
      )
      expect(onMove).toHaveBeenCalledTimes(1)
    })

    it(`does not move track on cancelled drag'n drop`, async () => {
      expect(get(isMoveInProgress)).toBe(false)
      const dropped = screen.queryByTestId('paragraph')
      const dragged = screen.queryByText(items[2].tags.title)

      await fireEvent.mouseDown(dragged)
      await fireEvent.mouseMove(dragged)
      expect(get(isMoveInProgress)).toBe(true)
      await fireEvent.mouseEnter(dropped)
      await fireEvent.mouseUp(dropped)

      expect(get(isMoveInProgress)).toBe(false)
      expect(onMove).not.toHaveBeenCalled()
    })

    it(`does not move track on click`, async () => {
      const dragged = screen.queryByText(items[2].tags.title)

      await fireEvent.mouseDown(dragged)
      expect(get(isMoveInProgress)).toBe(false)
      await fireEvent.mouseUp(dragged)

      expect(get(isMoveInProgress)).toBe(false)
      expect(onMove).not.toHaveBeenCalled()
    })
  })
})
