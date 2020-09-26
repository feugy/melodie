'use strict'

import { tick } from 'svelte'
import { get } from 'svelte/store'
import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import faker from 'faker'
import TracksQueue from './TracksQueue.svelte'
import { add, clear, index, current } from '../../stores/track-queue'
import * as playlistStore from '../../stores/playlists'
import { addRefs, mockInvoke, sleep } from '../../tests'

describe('TracksQueue component', () => {
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

  describe('given a list of track', () => {
    beforeEach(async () => {
      add(tracks)
      mockInvoke.mockResolvedValueOnce({ total: 0, results: [] })
      render(html`<${TracksQueue} />`)
      await tick()
    })

    it('jumps to track on click', async () => {
      expect(get(index)).toEqual(0)

      await fireEvent.click(screen.getByText(tracks[2].tags.title))
      await tick()

      expect(get(index)).toEqual(2)

      await fireEvent.click(screen.getByText(tracks[1].tags.title))
      await tick()

      expect(get(index)).toEqual(1)
    })

    it('clears tracks queue', async () => {
      expectListItems(tracks)
      expect(get(current)).toEqual(tracks[0])

      await fireEvent.click(screen.queryByText('delete'))
      await sleep(300)

      expect(get(current)).not.toBeDefined()
      expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    })

    it('removes track on button click', async () => {
      expectListItems(tracks)

      const removed = tracks[1].tags.title
      await fireEvent.click(
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

      await fireEvent.mouseDown(dragged)
      await fireEvent.mouseMove(dragged)
      await fireEvent.mouseEnter(hovered.closest('li'))
      await fireEvent.mouseEnter(dropped.closest('li'))
      await fireEvent.mouseUp(dropped)
      await tick()

      expectListItems([tracks[1], tracks[2], tracks[0], tracks[3]])
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

      await fireEvent.click(screen.queryByText('library_add'))
      await fireEvent.click(screen.queryByText(playlist.name))
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
