import { faker } from '@faker-js/faker'
import { get } from 'svelte/store'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sleep, translate } from '../tests'
import { invoke } from '../utils'
import {
  appendTracks,
  isListing,
  list,
  moveTrack,
  playlists,
  remove,
  removeTrack
} from './playlists'
import { clear, current } from './snackbars'

describe('playlists store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
      const id = faker.number.int()
      expect(await appendTracks({ id, tracks: [] })).toBeNull()
      expect(invoke).not.toHaveBeenCalled()
      expect(get(current)).toBeUndefined()
    })

    it('appends tracks to existing playlist', async () => {
      const tracks = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() }
      ]
      const trackIds = tracks.map(({ id }) => id)

      const id = faker.number.int()
      const playlist = { id, trackIds }
      invoke.mockResolvedValueOnce(playlist)

      expect(await appendTracks({ id, tracks })).toEqual(playlist)
      expect(invoke).toHaveBeenCalledWith('playlists.append', id, trackIds)
      expect(invoke).toHaveBeenCalledOnce()
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
      const playlist = { id: faker.number.int(), name, trackIds }
      invoke.mockResolvedValueOnce(playlist)

      expect(await appendTracks({ name, tracks })).toEqual(playlist)
      expect(invoke).toHaveBeenCalledWith('playlists.save', {
        name,
        trackIds
      })
      expect(invoke).toHaveBeenCalledOnce()
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
        id: faker.number.int(),
        name: faker.commerce.productName(),
        trackIds: [
          faker.number.int(),
          faker.number.int(),
          faker.number.int(),
          faker.number.int()
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
      expect(invoke).toHaveBeenCalledOnce()
      expect(get(current)).toBeNull()
    })

    it('ignores invalid indices', async () => {
      const playlist = {
        id: faker.number.int(),
        name: faker.commerce.productName(),
        trackIds: [
          faker.number.int(),
          faker.number.int(),
          faker.number.int(),
          faker.number.int()
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
        id: faker.number.int(),
        name: faker.commerce.productName(),
        trackIds: [1, 2, 3, 4]
      }
      invoke.mockResolvedValueOnce(playlist)

      expect(await moveTrack(playlist, { from: 0, to: 2 })).toEqual(playlist)
      expect(invoke).toHaveBeenCalledWith('playlists.save', {
        ...playlist,
        trackIds: [2, 3, 1, 4]
      })
      expect(invoke).toHaveBeenCalledOnce()
      expect(get(current)).toBeNull()
    })

    it('move tracks backward', async () => {
      const playlist = {
        id: faker.number.int(),
        name: faker.commerce.productName(),
        trackIds: [1, 2, 3, 4]
      }
      invoke.mockResolvedValueOnce(playlist)

      expect(await moveTrack(playlist, { from: 3, to: 1 })).toEqual(playlist)
      expect(invoke).toHaveBeenCalledWith('playlists.save', {
        ...playlist,
        trackIds: [1, 4, 2, 3]
      })
      expect(invoke).toHaveBeenCalledOnce()
      expect(get(current)).toBeNull()
    })

    it('ignores invalid indices', async () => {
      const playlist = {
        id: faker.number.int(),
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
        id: faker.number.int(),
        name: faker.commerce.productName(),
        trackIds: [faker.number.int(), faker.number.int()]
      }
      invoke.mockResolvedValueOnce(null)

      expect(await remove(playlist)).toBeNull()
      expect(invoke).toHaveBeenCalledWith('playlists.save', {
        id: playlist.id,
        trackIds: []
      })
      expect(invoke).toHaveBeenCalledOnce()
      expect(get(current)).toBeNull()
    })
  })
})
