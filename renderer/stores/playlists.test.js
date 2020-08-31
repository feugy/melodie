'use strict'

import faker from 'faker'
import { get } from 'svelte/store'
import { playlists, list, appendTracks } from './playlists'
import { mockInvoke, sleep } from '../tests'

describe('playlists store', () => {
  it('lists all playlists', async () => {
    const total = 13
    const data = Array.from({ length: total }, (v, i) => i)
    mockInvoke.mockImplementation(
      async (channel, service, method, { size, from }) => ({
        total,
        size,
        from: from || 0,
        results: data.slice(from || 0, from + size)
      })
    )
    expect(get(playlists)).toEqual([])
    await list()
    await sleep(100)
    expect(get(playlists)).toEqual(data)
    expect(mockInvoke).toHaveBeenCalledWith(
      'remote',
      'listEngine',
      'listPlaylists',
      expect.any(Object)
    )
  })

  describe('appendTracks', () => {
    beforeEach(jest.clearAllMocks)

    it('does not append empty track list', async () => {
      const id = faker.random.number()
      expect(await appendTracks({ id, tracks: [] })).toEqual(null)
      expect(mockInvoke).not.toHaveBeenCalled()
    })

    it('appends tracks to existing playlist', async () => {
      const tracks = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() }
      ]
      const trackIds = tracks.map(({ id }) => id)

      const id = faker.random.number()
      const playlist = { id, trackIds }
      mockInvoke.mockResolvedValueOnce(playlist)

      expect(await appendTracks({ id, tracks })).toEqual(playlist)
      expect(mockInvoke).toHaveBeenCalledWith(
        'remote',
        'playlistsManager',
        'append',
        id,
        trackIds
      )
      expect(mockInvoke).toHaveBeenCalledTimes(1)
    })

    it('creates new playlist with tracks', async () => {
      const tracks = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() }
      ]
      const trackIds = tracks.map(({ id }) => id)

      const name = faker.commerce.productName()
      const playlist = { id: faker.random.number(), name, trackIds }
      mockInvoke.mockResolvedValueOnce(playlist)

      expect(await appendTracks({ name, tracks })).toEqual(playlist)
      expect(mockInvoke).toHaveBeenCalledWith(
        'remote',
        'playlistsManager',
        'save',
        { name, trackIds }
      )
      expect(mockInvoke).toHaveBeenCalledTimes(1)
    })
  })
})
