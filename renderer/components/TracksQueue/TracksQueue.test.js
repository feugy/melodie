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
  beforeEach(() => clear())

  describe('given a list of track', () => {
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

    beforeEach(async () => {
      add(tracks)
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
      await tick()

      expect(get(current)).not.toBeDefined()
      expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    })

    it('removes track on button click', async () => {
      expectListItems(tracks)

      const removed = tracks[1].tags.title
      await fireEvent.click(
        screen.getByText(removed).closest('li').querySelector('button')
      )
      await tick()

      expectListItems([tracks[0], ...tracks.slice(2)])
      expect(screen.queryByText(removed)).not.toBeInTheDocument()
    })

    it('reorders tracks in the list', async () => {
      expectListItems(tracks)

      const hovered = screen.queryByText(tracks[2].tags.title)
      const dropped = screen.queryByText(tracks[3].tags.title)

      await fireEvent.dragStart(screen.queryByText(tracks[0].tags.title))
      await fireEvent.dragOver(hovered)
      await fireEvent.dragLeave(hovered)
      await fireEvent.dragOver(dropped)
      await fireEvent.drop(dropped)
      await tick()

      expectListItems([tracks[1], tracks[2], tracks[3], tracks[0]])
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

      beforeAll(async () => {
        await playlistStore.reset()
        mockInvoke.mockResolvedValueOnce({
          total: playlists.length,
          size: playlists.length,
          from: 0,
          results: playlists
        })
        await playlistStore.list()

        jest.resetAllMocks()
      })

      it('adds entire queue to existing playlist', async () => {
        const playlist = faker.random.arrayElement(playlists)

        await fireEvent.click(screen.queryByText('playlist_add'))
        await fireEvent.click(screen.queryByText(playlist.name))
        await sleep(250)

        expectListItems(tracks)
        expect(mockInvoke).toHaveBeenCalledWith(
          'remote',
          'playlistsManager',
          'append',
          playlist.id,
          tracks.map(({ id }) => id)
        )
        expect(mockInvoke).toHaveBeenCalledTimes(1)
      })
    })
  })
})
