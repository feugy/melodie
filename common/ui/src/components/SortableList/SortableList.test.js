'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import faker from 'faker'
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
    expect(screen.getByText(track2.tags.title)).toBeInTheDocument()
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
    const dataTransfer = { setDragImage: jest.fn() }
    let pageY

    beforeAll(() => {
      // JSDom does not support setting pageY, we have do do it ourselve
      Object.defineProperty(Event.prototype, 'pageY', {
        enumerable: true,
        get() {
          return pageY
        }
      })
    })

    beforeEach(async () => {
      render(
        html`<p data-testid="paragraph">fake drop</p>
          <${SortableList} items=${items} on:move=${onMove} />`
      )
      jest.resetAllMocks()
    })

    it('drags track forward in the list', async () => {
      const dragged = screen.queryByText(items[1].tags.title)
      const hovered = screen.queryByText(items[2].tags.title)
      const dropped = screen.queryByText(items[3].tags.title)

      fireEvent.dragStart(dragged, { dataTransfer })
      fireEvent.dragEnter(dragged, { dataTransfer })
      fireEvent.dragEnter(hovered.closest('li'), { dataTransfer })
      fireEvent.dragEnter(dropped.closest('li'), { dataTransfer })
      fireEvent.dragEnd(dropped, { dataTransfer })

      expect(onMove).toHaveBeenCalledWith(
        expect.objectContaining({ detail: { from: 1, to: 3 } })
      )
      expect(onMove).toHaveBeenCalledTimes(1)
    })

    it('drags track backward in the list', async () => {
      const dragged = screen.queryByText(items[3].tags.title)
      const hovered = screen.queryByText(items[2].tags.title)
      const dropped = screen.queryByText(items[1].tags.title)

      fireEvent.dragStart(dragged, { dataTransfer })
      fireEvent.dragEnter(dragged, { dataTransfer })
      fireEvent.dragEnter(hovered.closest('li'), { dataTransfer })
      fireEvent.dragEnter(dropped.closest('li'), { dataTransfer })
      fireEvent.dragEnd(dropped, { dataTransfer })

      expect(onMove).toHaveBeenCalledWith(
        expect.objectContaining({ detail: { from: 3, to: 2 } })
      )
      expect(onMove).toHaveBeenCalledTimes(1)
    })

    it('drags track at the very end', async () => {
      const dragged = screen.queryByText(items[0].tags.title)
      const hovered = screen.queryByText(items[4].tags.title)

      fireEvent.dragStart(dragged, { dataTransfer })
      fireEvent.dragEnter(dragged, { dataTransfer })
      fireEvent.dragEnter(hovered.closest('li'), { dataTransfer })
      fireEvent.dragEnd(dragged, { dataTransfer })

      expect(onMove).toHaveBeenCalledWith(
        expect.objectContaining({ detail: { from: 0, to: 4 } })
      )
      expect(onMove).toHaveBeenCalledTimes(1)
    })

    it('drags track at the very beginning', async () => {
      const dragged = screen.queryByText(items[1].tags.title)
      const hovered = screen.queryByText(items[0].tags.title)

      pageY = 10
      fireEvent.dragStart(dragged, { dataTransfer })
      pageY = 10
      fireEvent.dragEnter(dragged, { dataTransfer })
      pageY = 0
      fireEvent.dragEnter(hovered.closest('li'), { dataTransfer })
      fireEvent.dragEnd(dragged, { dataTransfer })

      expect(onMove).toHaveBeenCalledWith(
        expect.objectContaining({ detail: { from: 1, to: 0 } })
      )
      expect(onMove).toHaveBeenCalledTimes(1)
    })

    it(`does not move track on cancelled drag'n drop`, async () => {
      const dropped = screen.queryByTestId('paragraph')
      const dragged = screen.queryByText(items[2].tags.title)

      fireEvent.dragStart(dragged, { dataTransfer })
      fireEvent.dragEnter(dragged, { dataTransfer })
      fireEvent.dragEnter(dropped, { dataTransfer })
      fireEvent.dragEnd(dropped, { dataTransfer })

      expect(onMove).not.toHaveBeenCalled()
    })

    it(`does not move track on click`, async () => {
      const dragged = screen.queryByText(items[2].tags.title)

      fireEvent.mouseDown(dragged)
      fireEvent.mouseUp(dragged)

      expect(onMove).not.toHaveBeenCalled()
    })
  })
})
