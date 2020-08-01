'use strict'

import faker from 'faker'
import { tick } from 'svelte'
import { get } from 'svelte/store'
import { mockInvoke, mockIpcRenderer, sleep } from '../tests'
import { albums, list, load, reset } from './albums'

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
      expect(get(albums)).toEqual([])
      await list()
      await sleep(100)
      expect(get(albums)).toEqual(data)
      expect(mockInvoke).toHaveBeenCalledTimes(3)
      expect(mockInvoke).toHaveBeenCalledWith(
        'remote',
        'listEngine',
        'listAlbums',
        expect.any(Object)
      )
    })

    it('receives change updates', async () => {
      const data = Array.from({ length: 8 }, (v, i) => ({
        id: i,
        name: i
      }))
      const updated1 = { ...data[3], updated: true }
      const updated2 = { ...data[6], updated: true }
      mockInvoke.mockResolvedValueOnce({
        total: data.length,
        size: data.length,
        from: 0,
        results: data
      })
      await list()
      await sleep(100)
      expect(get(albums)).toEqual(data)

      mockIpcRenderer.emit('album-change', null, updated1)
      expect(get(albums)).toEqual([
        ...data.slice(0, 3),
        updated1,
        ...data.slice(4)
      ])

      mockIpcRenderer.emit('album-change', null, updated2)
      expect(get(albums)).toEqual([
        ...data.slice(0, 3),
        updated1,
        ...data.slice(4, 6),
        updated2,
        ...data.slice(7)
      ])

      expect(mockInvoke).toHaveBeenCalledTimes(1)
    })

    it('applies sort on changes', async () => {
      const data = Array.from({ length: 8 }, (v, i) => ({
        id: i,
        name: `${i}0`
      }))
      const updated = { ...data[3], name: `2`, updated: true }
      mockInvoke.mockResolvedValueOnce({
        total: data.length,
        size: data.length,
        from: 0,
        results: data
      })
      await list()
      await sleep(100)
      expect(get(albums)).toEqual(data)

      mockIpcRenderer.emit('album-change', null, updated)
      expect(get(albums)).toEqual([
        ...data.slice(0, 1),
        updated,
        ...data.slice(1, 3),
        ...data.slice(4)
      ])
      expect(mockInvoke).toHaveBeenCalledTimes(1)
    })

    it('receives removal updates', async () => {
      const data = Array.from({ length: 8 }, (v, i) => ({
        id: i,
        name: faker.random.word()
      }))
      const removed1 = data[3].id
      const removed2 = data[6].id
      mockInvoke.mockResolvedValueOnce({
        total: data.length,
        size: data.length,
        from: 0,
        results: data
      })
      await list()
      await sleep(100)
      expect(get(albums)).toEqual(data)

      mockIpcRenderer.emit('album-removal', null, removed1)
      expect(get(albums)).toEqual([...data.slice(0, 3), ...data.slice(4)])

      mockIpcRenderer.emit('album-removal', null, removed2)
      expect(get(albums)).toEqual([
        ...data.slice(0, 3),
        ...data.slice(4, 6),
        ...data.slice(7)
      ])

      expect(mockInvoke).toHaveBeenCalledTimes(1)
    })
  })

  describe('load', () => {
    it('load album with all tracks', async () => {
      const album = {
        id: faker.random.uuid(),
        name: faker.commerce.productName(),
        tracks: Array.from(
          { length: faker.random.number({ min: 10, max: 30 }) },
          (v, i) => i
        )
      }
      mockInvoke
        .mockResolvedValueOnce({
          total: 1,
          results: [{ ...album, tracks: undefined }]
        })
        .mockResolvedValueOnce(album)

      await list()
      await load(album.id)
      await tick()
      expect(get(albums)).toEqual([album])
      expect(mockInvoke).toHaveBeenNthCalledWith(
        2,
        'remote',
        'listEngine',
        'fetchWithTracks',
        'album',
        album.id
      )
    })

    it('adds new album to the list', async () => {
      const album = {
        id: faker.random.uuid(),
        name: faker.commerce.productName(),
        tracks: Array.from(
          { length: faker.random.number({ min: 10, max: 30 }) },
          (v, i) => i
        )
      }
      mockInvoke.mockResolvedValueOnce(album)

      await load(album.id)
      await tick()
      expect(get(albums)).toEqual([album])
      expect(mockInvoke).toHaveBeenCalledWith(
        'remote',
        'listEngine',
        'fetchWithTracks',
        'album',
        album.id
      )
    })
  })

  it('handles unknown album', async () => {
    const id = faker.random.uuid()
    mockInvoke.mockResolvedValueOnce(null)

    await load(id)
    await tick()
    expect(get(albums)).toEqual([])
    expect(mockInvoke).toHaveBeenCalledWith(
      'remote',
      'listEngine',
      'fetchWithTracks',
      'album',
      id
    )
  })
})
