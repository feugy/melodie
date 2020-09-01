'use strict'

import { writable } from 'svelte/store'
import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import faker from 'faker'
import TracksList from './TracksList.svelte'
import { addRefs } from '../../tests'

describe('TracksList component', () => {
  it('allows duplicated tracks', async () => {
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
    const tracks = [track1, track2, track1]

    render(html`<${TracksList} tracks=${tracks} />`)

    expect(screen.getAllByText(track1.tags.title)).toHaveLength(2)
    expect(screen.getAllByText(track2.tags.title)).toHaveLength(1)
  })

  describe('given a list of track', () => {
    const currentIndex = writable()
    const tracks = [
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

    const onClick = jest.fn()
    const onMove = jest.fn()
    const onRemove = jest.fn()

    beforeEach(async () => {
      render(
        html`<p data-testid="paragraph">fake drop</p>
          <${TracksList}
            tracks=${tracks}
            currentIndex=${currentIndex}
            on:click=${onClick}
            on:move=${onMove}
            on:remove=${onRemove}
          />`
      )
      jest.resetAllMocks()
    })

    it('dispatches click event', async () => {
      await fireEvent.click(screen.getByText(tracks[2].tags.title))
      expect(onClick).toHaveBeenCalledWith(
        expect.objectContaining({ detail: 2 })
      )

      await fireEvent.click(screen.getByText(tracks[1].tags.title))
      expect(onClick).toHaveBeenCalledWith(
        expect.objectContaining({ detail: 1 })
      )
      expect(onClick).toHaveBeenCalledTimes(2)
    })

    it('dispatches remove event', async () => {
      const removed = faker.random.arrayElement(tracks).tags.title
      await fireEvent.click(
        screen.getByText(removed).closest('li').querySelector('button')
      )

      expect(onRemove).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: tracks.findIndex(({ tags: { title } }) => removed === title)
        })
      )
      expect(onRemove).toHaveBeenCalledTimes(1)
    })

    it('drags track forward in the list', async () => {
      const hovered = screen.queryByText(tracks[2].tags.title)
      const dropped = screen.queryByText(tracks[3].tags.title)

      await fireEvent.dragStart(screen.queryByText(tracks[0].tags.title))
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
      const dropped = screen.queryByText(tracks[0].tags.title)

      await fireEvent.dragStart(screen.queryByText(tracks[2].tags.title))
      await fireEvent.dragOver(dropped)
      await fireEvent.drop(dropped)

      expect(onMove).toHaveBeenCalledWith(
        expect.objectContaining({ detail: { from: 2, to: 0 } })
      )
      expect(onMove).toHaveBeenCalledTimes(1)
    })

    it(`does not move track on cancelled drag'n drop`, async () => {
      const dropped = screen.queryByTestId('paragraph')

      await fireEvent.dragStart(screen.queryByText(tracks[2].tags.title))
      await fireEvent.dragOver(dropped)
      await fireEvent.drop(dropped)

      expect(onMove).not.toHaveBeenCalled()
    })
  })
})
