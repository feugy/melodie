import { faker } from '@faker-js/faker'
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { tick } from 'svelte'
import { get } from 'svelte/store'
import html from 'svelte-htm'
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import * as playlistStore from '../../stores/playlists'
import * as snackbars from '../../stores/snackbars'
import {
  add,
  clear,
  current,
  index,
  tracks as trackQueue
} from '../../stores/track-queue'
import * as tutorial from '../../stores/tutorial'
import { addRefs, translate } from '../../tests'
import { invoke } from '../../utils'
import TracksQueue from './TracksQueue.svelte'

describe('TracksQueue component', () => {
  beforeAll(() => {
    // JSDom does not support scrollIntoView as it doesn't do layout
    Element.prototype.scrollIntoView = vi.fn()
  })

  beforeEach(() => {
    vi.resetAllMocks()
    clear()
  })

  const tracks = [
    {
      id: 1,
      tags: {
        title: faker.commerce.productName(),
        artists: [faker.person.firstName()]
      },
      media: faker.system.fileName()
    },
    {
      id: 2,
      tags: {
        title: faker.commerce.productName(),
        artists: [faker.person.firstName()]
      },
      media: faker.system.fileName()
    },
    {
      id: 3,
      tags: {
        title: faker.commerce.productName(),
        artists: [faker.person.firstName()]
      },
      media: faker.system.fileName()
    },
    {
      id: 4,
      tags: {
        title: faker.commerce.productName(),
        artists: [faker.person.firstName()]
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
      expect(get(index)).toBe(0)

      await userEvent.click(screen.getByText(tracks[2].tags.title))
      await waitFor(() =>
        expect(
          screen.getByText(tracks[2].tags.title).closest('.row').scrollIntoView
        ).toHaveBeenCalled()
      )
      expect(get(index)).toBe(2)

      await userEvent.click(screen.getByText(tracks[1].tags.title))
      await waitFor(() =>
        expect(
          screen.getByText(tracks[1].tags.title).closest('.row').scrollIntoView
        ).toHaveBeenCalled()
      )
      expect(get(index)).toBe(1)
    })

    it('clears tracks queue', async () => {
      expectListItems(tracks)
      expect(get(current)).toEqual(tracks[0])
      expect(get(trackQueue)).toEqual(tracks)

      await userEvent.click(screen.queryByTestId('clear-button'))
      await waitFor(() =>
        expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
      )
      expect(get(current)).toBeUndefined()
      expect(get(trackQueue)).toEqual([])
    })

    it('removes track on button click', async () => {
      expectListItems(tracks)

      const removed = tracks[1].tags.title
      await userEvent.click(
        screen.getByText(removed).closest('.row').querySelector('.i-mdi-close')
      )
      await waitFor(() =>
        expect(screen.queryByText(removed)).not.toBeInTheDocument()
      )
      expectListItems([tracks[0], ...tracks.slice(2)])
    })

    // eslint-disable-next-line vitest/expect-expect -- expectListItems contains expectations
    it('reorders tracks in the list', async () => {
      expectListItems(tracks)

      const dragged = screen.queryByText(tracks[0].tags.title)
      const hovered = screen.queryByText(tracks[2].tags.title)
      const dropped = screen.queryByText(tracks[3].tags.title)
      const dataTransfer = { setDragImage: vi.fn() }

      fireEvent.dragStart(dragged, { dataTransfer })
      fireEvent.dragEnter(dragged, { dataTransfer })
      fireEvent.dragEnter(hovered.closest('.row'), { dataTransfer })
      fireEvent.dragEnter(dropped.closest('.row'), { dataTransfer })
      fireEvent.dragEnd(dropped, { dataTransfer })
      await tick()

      expectListItems([tracks[1], tracks[2], tracks[3], tracks[0]])
    })

    it('does not scroll to current track on track removal', async () => {
      const secondTrack = screen.getByText(tracks[2].tags.title)

      expectListItems(tracks)
      expect(get(current)).toEqual(tracks[0])

      await userEvent.click(secondTrack)
      await waitFor(() =>
        expect(secondTrack.closest('.row').scrollIntoView).toHaveBeenCalled()
      )
      expect(get(index)).toBe(2)

      vi.clearAllMocks()

      await userEvent.click(
        screen
          .getByText(tracks[3].tags.title)
          .closest('.row')
          .querySelector('.i-mdi-close')
      )
      await waitFor(() =>
        expect(
          secondTrack.closest('.row').scrollIntoView
        ).not.toHaveBeenCalled()
      )
      expect(get(index)).toBe(2)
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
      expect(get(tutorial.current)).not.toBeNull()
      expectListItems(tracks.slice(0, 2))
      expect(get(current)).toEqual(tracks[0])

      await userEvent.click(screen.queryByTestId('clear-button'))
      await waitFor(() => expectListItems(tracks.slice(0, 2)))
      expect(get(current)).toEqual(tracks[0])

      expect(snackbar).toEqual({
        message: translate('no clear during tutorial')
      })
    })

    it('can not remove last track', async () => {
      expect(get(tutorial.current)).not.toBeNull()
      expectListItems(tracks.slice(0, 2))
      expect(get(current)).toEqual(tracks[0])

      await userEvent.click(
        screen
          .getByText(tracks[0].tags.title)
          .closest('.row')
          .querySelector('.i-mdi-close')
      )
      await waitFor(() => expect(get(current)).toEqual(tracks[1]))
      expectListItems(tracks.slice(1, 2))

      await userEvent.click(
        screen
          .getByText(tracks[1].tags.title)
          .closest('.row')
          .querySelector('.i-mdi-close')
      )
      await waitFor(() => expect(get(current)).toEqual(tracks[1]))
      expectListItems(tracks.slice(1, 2))

      expect(snackbar).toEqual({
        message: translate('no clear during tutorial')
      })
    })
  })

  describe('given some playlist', () => {
    const playlists = [
      {
        id: faker.number.int(),
        name: faker.commerce.productName(),
        trackIds: [faker.number.int(), faker.number.int()]
      },
      {
        id: faker.number.int(),
        name: faker.commerce.productName(),
        trackIds: [faker.number.int(), faker.number.int()]
      },
      {
        id: faker.number.int(),
        name: faker.commerce.productName(),
        trackIds: [faker.number.int(), faker.number.int()]
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
      await tick()
    })

    it('adds entire queue to existing playlist', async () => {
      const playlist = faker.helpers.arrayElement(playlists)

      await userEvent.click(screen.queryByTestId('add-to-playlist-button'))
      const name = await screen.findByText(playlist.name)
      await userEvent.click(name)
      await waitFor(() => expectListItems(tracks))
      expect(invoke).toHaveBeenCalledWith(
        'playlists.append',
        playlist.id,
        tracks.map(({ id }) => id)
      )
      expect(invoke).toHaveBeenCalledTimes(2)
    })
  })
})
