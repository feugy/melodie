'use strict'

import faker from 'faker'
import { tick } from 'svelte'
import { get } from 'svelte/store'
import { mockInvoke, sleep } from '../tests'
import { albums as albumsStore, list, loadTracks, reset } from './albums'

describe('albums store', () => {
  beforeEach(() => {
    reset()
    jest.resetAllMocks()
  })

  describe('list', () => {
    it('fetches all items progressively', async () => {
      const total = 13
      const size = 5
      const data = Array.from({ length: total }, (v, i) => i)
      mockInvoke
        .mockResolvedValueOnce({
          total,
          size,
          from: 0,
          results: data.slice(0, size)
        })
        .mockResolvedValueOnce({
          total,
          size,
          from: size,
          results: data.slice(size, size * 2)
        })
        .mockResolvedValueOnce({
          total,
          size,
          from: size * 2,
          results: data.slice(size * 2)
        })
      expect(get(albumsStore)).toEqual([])
      await list()
      await sleep(100)
      expect(get(albumsStore)).toEqual(data)
      expect(mockInvoke).toHaveBeenCalledTimes(3)
      expect(mockInvoke).toHaveBeenCalledWith(
        'remote',
        'listEngine',
        'listAlbums',
        expect.any(Object)
      )
    })
  })

  describe('loadTracks', () => {
    it('list all tracks of an item', async () => {
      const album = {
        id: faker.random.uuid(),
        name: faker.commerce.productName()
      }
      const data = Array.from(
        { length: faker.random.number({ min: 10, max: 30 }) },
        (v, i) => i
      )
      mockInvoke
        .mockResolvedValueOnce({ total: 1, results: [album] })
        .mockResolvedValueOnce(data)

      await list()
      await loadTracks(album)
      await tick()
      expect(get(albumsStore)).toEqual([
        {
          ...album,
          tracks: data
        }
      ])
      expect(mockInvoke).toHaveBeenNthCalledWith(
        2,
        'remote',
        'listEngine',
        'listTracksOf',
        album
      )
    })

    it('does not alter unknown item', async () => {
      const album = {
        id: faker.random.uuid(),
        name: faker.commerce.productName()
      }
      const data = Array.from(
        { length: faker.random.number({ min: 10, max: 30 }) },
        (v, i) => i
      )
      mockInvoke.mockResolvedValueOnce(data)

      await loadTracks(album)
      await tick()
      expect(get(albumsStore)).toEqual([])
      expect(mockInvoke).toHaveBeenCalledWith(
        'remote',
        'listEngine',
        'listTracksOf',
        album
      )
    })
  })
})
