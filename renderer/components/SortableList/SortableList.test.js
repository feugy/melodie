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
      const hovered = screen.queryByText(items[2].tags.title)
      const dropped = screen.queryByText(items[3].tags.title)

      await fireEvent.dragStart(screen.queryByText(items[0].tags.title))
      await fireEvent.dragOver(hovered)
      await fireEvent.dragLeave(hovered)
      await fireEvent.dragOver(dropped)
      await fireEvent.drop(dropped)

      expect(onMove).toHaveBeenCalledWith(
        expect.objectContaining({ detail: { from: 0, to: 3 } })
      )
      expect(onMove).toHaveBeenCalledTimes(1)
    })

    it('drags track backward in the list', async () => {
      const dropped = screen.queryByText(items[0].tags.title)

      await fireEvent.dragStart(screen.queryByText(items[2].tags.title))
      await fireEvent.dragOver(dropped)
      await fireEvent.drop(dropped)

      expect(onMove).toHaveBeenCalledWith(
        expect.objectContaining({ detail: { from: 2, to: 0 } })
      )
      expect(onMove).toHaveBeenCalledTimes(1)
    })

    it(`does not move track on cancelled drag'n drop`, async () => {
      const dropped = screen.queryByTestId('paragraph')

      await fireEvent.dragStart(screen.queryByText(items[2].tags.title))
      await fireEvent.dragOver(dropped)
      await fireEvent.drop(dropped)

      expect(onMove).not.toHaveBeenCalled()
    })
  })
})
