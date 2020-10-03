'use strict'

import { tick } from 'svelte'
import { get } from 'svelte/store'
import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import faker from 'faker'
import TracksQueue from './TracksQueue.svelte'
import { add, clear, index, current } from '../../stores/track-queue'
import * as playlistStore from '../../stores/playlists'
import * as tutorial from '../../stores/tutorial'
import * as snackbars from '../../stores/snackbars'
import { addRefs, mockInvoke, sleep, translate } from '../../tests'

describe('TracksQueue component', () => {
  beforeAll(() => {
    // JSDom does not support scrollIntoView as it doesn't do layout
    Element.prototype.scrollIntoView = jest.fn()
  })

  beforeEach(() => {
    jest.resetAllMocks()
    clear()
  })

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

  function expectListItems(tracks) {
    expect(
      screen.queryAllByRole('listitem').map(node => node.textContent)
    ).toEqual(
      tracks.map(({ tags: { title } }) => expect.stringContaining(title))
    )
  }

  describe('given a list of tracks', () => {
    beforeEach(async () => {
      add(tracks)
      mockInvoke.mockResolvedValueOnce({ total: 0, results: [] })
      render(html`<${TracksQueue} />`)
      await tick()
    })

    it('jumps to track on click', async () => {
      expect(get(index)).toEqual(0)

      fireEvent.click(screen.getByText(tracks[2].tags.title))
      await tick()

      expect(get(index)).toEqual(2)
      expect(
        screen.getByText(tracks[2].tags.title).closest('.row').scrollIntoView
      ).toHaveBeenCalled()

      fireEvent.click(screen.getByText(tracks[1].tags.title))
      await tick()

      expect(get(index)).toEqual(1)
      expect(
        screen.getByText(tracks[1].tags.title).closest('.row').scrollIntoView
      ).toHaveBeenCalled()
    })

    it('clears tracks queue', async () => {
      expectListItems(tracks)
      expect(get(current)).toEqual(tracks[0])

      fireEvent.click(screen.queryByText('delete'))
      await sleep(300)

      expect(get(current)).not.toBeDefined()
      expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    })

    it('removes track on button click', async () => {
      expectListItems(tracks)

      const removed = tracks[1].tags.title
      fireEvent.click(
        screen.getByText(removed).closest('li').querySelector('button')
      )
      await sleep(300)

      expectListItems([tracks[0], ...tracks.slice(2)])
      expect(screen.queryByText(removed)).not.toBeInTheDocument()
    })

    it('reorders tracks in the list', async () => {
      expectListItems(tracks)

      const dragged = screen.queryByText(tracks[0].tags.title)
      const hovered = screen.queryByText(tracks[2].tags.title)
      const dropped = screen.queryByText(tracks[3].tags.title)
      const dataTransfer = { setDragImage: jest.fn() }

      fireEvent.dragStart(dragged, { dataTransfer })
      fireEvent.dragEnter(dragged, { dataTransfer })
      fireEvent.dragEnter(hovered.closest('li'), { dataTransfer })
      fireEvent.dragEnter(dropped.closest('li'), { dataTransfer })
      fireEvent.dragEnd(dropped, { dataTransfer })
      await tick()

      expectListItems([tracks[1], tracks[2], tracks[3], tracks[0]])
    })
  })

  describe('given playing tutorial and having a list of tracks', () => {
    let snackbar
    let snackbarSubscription

    beforeEach(async () => {
      snackbars.clear()
      snackbarSubscription = snackbars.current.subscribe(
        data => (snackbar = data)
      )
      add(tracks.slice(0, 2))
      mockInvoke.mockResolvedValueOnce({ total: 0, results: [] })
      tutorial.start()
      await tick()
      render(html`<${TracksQueue} />`)
      await tick()
    })

    afterEach(() => {
      snackbarSubscription.unsubscribe()
    })

    it('can not clear the tracks queue', async () => {
      expect(get(tutorial.current)).not.toEqual(null)
      expectListItems(tracks.slice(0, 2))
      expect(get(current)).toEqual(tracks[0])

      fireEvent.click(screen.queryByText('delete'))
      await sleep(300)

      expectListItems(tracks.slice(0, 2))
      expect(get(current)).toEqual(tracks[0])

      expect(snackbar).toEqual({
        message: translate('no clear during tutorial')
      })
    })

    it('can not remove last track', async () => {
      expect(get(tutorial.current)).not.toEqual(null)
      expectListItems(tracks.slice(0, 2))
      expect(get(current)).toEqual(tracks[0])

      fireEvent.click(
        screen
          .getByText(tracks[0].tags.title)
          .closest('li')
          .querySelector('button')
      )
      await sleep(300)

      expectListItems(tracks.slice(1, 2))
      expect(get(current)).toEqual(tracks[1])

      fireEvent.click(
        screen
          .getByText(tracks[1].tags.title)
          .closest('li')
          .querySelector('button')
      )
      await sleep(300)

      expectListItems(tracks.slice(1, 2))
      expect(get(current)).toEqual(tracks[1])

      expect(snackbar).toEqual({
        message: translate('no clear during tutorial')
      })
    })
  })

  describe('given some playlist', () => {
    const playlists = [
      {
        id: faker.random.number(),
        name: faker.commerce.productName(),
        trackIds: [faker.random.number(), faker.random.number()]
      },
      {
        id: faker.random.number(),
        name: faker.commerce.productName(),
        trackIds: [faker.random.number(), faker.random.number()]
      },
      {
        id: faker.random.number(),
        name: faker.commerce.productName(),
        trackIds: [faker.random.number(), faker.random.number()]
      }
    ]

    beforeEach(async () => {
      add(tracks)
      playlistStore.reset()
      mockInvoke.mockResolvedValueOnce({
        total: playlists.length,
        size: playlists.length,
        from: 0,
        results: playlists
      })
      render(html`<${TracksQueue} />`)
      await sleep()
    })

    it('adds entire queue to existing playlist', async () => {
      const playlist = faker.random.arrayElement(playlists)

      fireEvent.click(screen.queryByText('library_add'))
      await sleep()
      fireEvent.click(screen.queryByText(playlist.name))
      await sleep(250)

      expectListItems(tracks)
      expect(mockInvoke).toHaveBeenCalledWith(
        'remote',
        'playlists',
        'append',
        playlist.id,
        tracks.map(({ id }) => id)
      )
      expect(mockInvoke).toHaveBeenCalledTimes(2)
    })
  })
})
