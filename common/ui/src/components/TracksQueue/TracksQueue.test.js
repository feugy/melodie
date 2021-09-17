'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { tick } from 'svelte'
import { get } from 'svelte/store'
import html from 'svelte-htm'
import faker from 'faker'
import TracksQueue from './TracksQueue.svelte'
import {
  add,
  clear,
  index,
  current,
  tracks as trackQueue
} from '../../stores/track-queue'
import * as playlistStore from '../../stores/playlists'
import * as tutorial from '../../stores/tutorial'
import * as snackbars from '../../stores/snackbars'
import { invoke } from '../../utils'
import { addRefs, sleep, translate } from '../../tests'

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
      invoke.mockResolvedValueOnce({ total: 0, results: [] })
      render(html`<${TracksQueue} />`)
      await tick()
    })

    it('jumps to track on click', async () => {
      expect(get(index)).toEqual(0)

      userEvent.click(screen.getByText(tracks[2].tags.title))
      await sleep(310)

      expect(get(index)).toEqual(2)
      expect(
        screen.getByText(tracks[2].tags.title).closest('.row').scrollIntoView
      ).toHaveBeenCalled()

      userEvent.click(screen.getByText(tracks[1].tags.title))
      await sleep(310)

      expect(get(index)).toEqual(1)
      expect(
        screen.getByText(tracks[1].tags.title).closest('.row').scrollIntoView
      ).toHaveBeenCalled()
    })

    it('clears tracks queue', async () => {
      expectListItems(tracks)
      expect(get(current)).toEqual(tracks[0])
      expect(get(trackQueue)).toEqual(tracks)

      userEvent.click(screen.queryByText('delete'))
      await sleep(400)

      expect(get(current)).not.toBeDefined()
      expect(get(trackQueue)).toEqual([])
      expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
    })

    it('removes track on button click', async () => {
      expectListItems(tracks)

      const removed = tracks[1].tags.title
      userEvent.click(
        screen.getByText(removed).closest('li').querySelector('button')
      )
      await sleep(310)

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

    it('does not scroll to current track on track removal', async () => {
      const secondTrack = screen.getByText(tracks[2].tags.title)

      expectListItems(tracks)
      expect(get(current)).toEqual(tracks[0])

      userEvent.click(secondTrack)
      await sleep(310)

      expect(get(index)).toEqual(2)
      expect(secondTrack.closest('.row').scrollIntoView).toHaveBeenCalled()

      jest.clearAllMocks()

      userEvent.click(
        screen
          .getByText(tracks[3].tags.title)
          .closest('li')
          .querySelector('button')
      )
      await sleep(310)

      expect(get(index)).toEqual(2)
      expect(secondTrack.closest('.row').scrollIntoView).not.toHaveBeenCalled()
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
      invoke.mockResolvedValueOnce({ total: 0, results: [] })
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

      userEvent.click(screen.queryByText('delete'))
      await sleep(310)

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

      userEvent.click(
        screen
          .getByText(tracks[0].tags.title)
          .closest('li')
          .querySelector('button')
      )
      await sleep(310)

      expectListItems(tracks.slice(1, 2))
      expect(get(current)).toEqual(tracks[1])

      userEvent.click(
        screen
          .getByText(tracks[1].tags.title)
          .closest('li')
          .querySelector('button')
      )
      await sleep(310)

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
      invoke.mockResolvedValueOnce({
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

      userEvent.click(screen.queryByText('library_add'))
      await sleep()
      userEvent.click(screen.queryByText(playlist.name))
      await sleep(250)

      expectListItems(tracks)
      expect(invoke).toHaveBeenCalledWith(
        'playlists.append',
        playlist.id,
        tracks.map(({ id }) => id)
      )
      expect(invoke).toHaveBeenCalledTimes(2)
    })
  })
})
