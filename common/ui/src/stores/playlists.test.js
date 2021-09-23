'use strict'

import faker from 'faker'
import { get } from 'svelte/store'
import {
  playlists,
  list,
  remove,
  appendTracks,
  removeTrack,
  moveTrack,
  isListing
} from './playlists'
import { clear, current } from './snackbars'
import { invoke } from '../utils'
import { sleep, translate } from '../tests'

describe('playlists store', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clear()
  })

  it('lists all playlists', async () => {
    const total = 13
    const data = Array.from({ length: total }, (v, i) => ({
      id: i,
      name: `${i}0`
    }))
    invoke.mockImplementation(async (invoked, type, { size, from }) => ({
      total,
      size,
      from: from || 0,
      results: data.slice(from || 0, from + size)
    }))
    expect(get(playlists)).toEqual([])
    expect(get(isListing)).toBe(false)
    await list()
    expect(get(isListing)).toBe(true)
    await sleep(100)
    expect(get(isListing)).toBe(false)
    expect(get(playlists)).toEqual(data)
    expect(invoke).toHaveBeenCalledWith(
      'tracks.list',
      'playlist',
      expect.any(Object)
    )
  })

  describe('appendTracks', () => {
    it('does not append empty track list', async () => {
      const id = faker.datatype.number()
      expect(await appendTracks({ id, tracks: [] })).toEqual(null)
      expect(invoke).not.toHaveBeenCalled()
      expect(get(current)).toBeNil()
    })

    it('appends tracks to existing playlist', async () => {
      const tracks = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() }
      ]
      const trackIds = tracks.map(({ id }) => id)

      const id = faker.datatype.number()
      const playlist = { id, trackIds }
      invoke.mockResolvedValueOnce(playlist)

      expect(await appendTracks({ id, tracks })).toEqual(playlist)
      expect(invoke).toHaveBeenCalledWith('playlists.append', id, trackIds)
      expect(invoke).toHaveBeenCalledTimes(1)
      await sleep()
      expect(get(current)).toEqual({
        message: translate('playlist _ updated', playlist),
        action: expect.any(Function),
        button: translate('open')
      })
    })

    it('creates new playlist with tracks', async () => {
      const tracks = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() }
      ]
      const trackIds = tracks.map(({ id }) => id)

      const name = faker.commerce.productName()
      const playlist = { id: faker.datatype.number(), name, trackIds }
      invoke.mockResolvedValueOnce(playlist)

      expect(await appendTracks({ name, tracks })).toEqual(playlist)
      expect(invoke).toHaveBeenCalledWith('playlists.save', {
        name,
        trackIds
      })
      expect(invoke).toHaveBeenCalledTimes(1)
      await sleep()
      expect(get(current)).toEqual({
        message: translate('playlist _ updated', playlist),
        action: expect.any(Function),
        button: translate('open')
      })
    })
  })

  describe('removeTrack', () => {
    it('removes track by index', async () => {
      const playlist = {
        id: faker.datatype.number(),
        name: faker.commerce.productName(),
        trackIds: [
          faker.datatype.number(),
          faker.datatype.number(),
          faker.datatype.number(),
          faker.datatype.number()
        ]
      }
      invoke.mockResolvedValueOnce(playlist)

      expect(await removeTrack(playlist, 2)).toEqual(playlist)
      expect(invoke).toHaveBeenCalledWith('playlists.save', {
        ...playlist,
        trackIds: [
          ...playlist.trackIds.slice(0, 2),
          ...playlist.trackIds.slice(2)
        ]
      })
      expect(invoke).toHaveBeenCalledTimes(1)
      expect(get(current)).toBeNil()
    })

    it('ignores invalid indices', async () => {
      const playlist = {
        id: faker.datatype.number(),
        name: faker.commerce.productName(),
        trackIds: [
          faker.datatype.number(),
          faker.datatype.number(),
          faker.datatype.number(),
          faker.datatype.number()
        ]
      }
      invoke.mockResolvedValue(playlist)

      expect(await removeTrack(playlist, -1)).toEqual(playlist)
      expect(invoke).toHaveBeenNthCalledWith(1, 'playlists.save', playlist)

      expect(await removeTrack(playlist, 100)).toEqual(playlist)
      expect(invoke).toHaveBeenNthCalledWith(2, 'playlists.save', playlist)
      expect(invoke).toHaveBeenCalledTimes(2)
    })
  })

  describe('moveTrack', () => {
    it('move tracks forward', async () => {
      const playlist = {
        id: faker.datatype.number(),
        name: faker.commerce.productName(),
        trackIds: [1, 2, 3, 4]
      }
      invoke.mockResolvedValueOnce(playlist)

      expect(await moveTrack(playlist, { from: 0, to: 2 })).toEqual(playlist)
      expect(invoke).toHaveBeenCalledWith('playlists.save', {
        ...playlist,
        trackIds: [2, 3, 1, 4]
      })
      expect(invoke).toHaveBeenCalledTimes(1)
      expect(get(current)).toBeNil()
    })

    it('move tracks backward', async () => {
      const playlist = {
        id: faker.datatype.number(),
        name: faker.commerce.productName(),
        trackIds: [1, 2, 3, 4]
      }
      invoke.mockResolvedValueOnce(playlist)

      expect(await moveTrack(playlist, { from: 3, to: 1 })).toEqual(playlist)
      expect(invoke).toHaveBeenCalledWith('playlists.save', {
        ...playlist,
        trackIds: [1, 4, 2, 3]
      })
      expect(invoke).toHaveBeenCalledTimes(1)
      expect(get(current)).toBeNil()
    })

    it('ignores invalid indices', async () => {
      const playlist = {
        id: faker.datatype.number(),
        name: faker.commerce.productName(),
        trackIds: [1, 2, 3, 4]
      }
      invoke.mockResolvedValue(playlist)

      expect(await moveTrack(playlist, { from: -1, to: 3 })).toEqual(playlist)
      expect(invoke).toHaveBeenNthCalledWith(1, 'playlists.save', playlist)

      expect(await moveTrack(playlist, { from: 200, to: 1 })).toEqual(playlist)
      expect(invoke).toHaveBeenNthCalledWith(2, 'playlists.save', playlist)

      expect(await moveTrack(playlist, { from: 1, to: -3 })).toEqual(playlist)
      expect(invoke).toHaveBeenNthCalledWith(3, 'playlists.save', playlist)

      expect(await moveTrack(playlist, { from: 1, to: 100 })).toEqual(playlist)
      expect(invoke).toHaveBeenNthCalledWith(4, 'playlists.save', playlist)
      expect(invoke).toHaveBeenCalledTimes(4)
    })
  })

  describe('remove', () => {
    it('removes playlist', async () => {
      const playlist = {
        id: faker.datatype.number(),
        name: faker.commerce.productName(),
        trackIds: [faker.datatype.number(), faker.datatype.number()]
      }
      invoke.mockResolvedValueOnce(null)

      expect(await remove(playlist)).toBeNull()
      expect(invoke).toHaveBeenCalledWith('playlists.save', {
        id: playlist.id,
        trackIds: []
      })
      expect(invoke).toHaveBeenCalledTimes(1)
      expect(get(current)).toBeNil()
    })
  })
})
