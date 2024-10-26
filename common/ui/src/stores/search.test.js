import { faker } from '@faker-js/faker'
import { get } from 'svelte/store'
import { describe, expect, it } from 'vitest'

import { sleep } from '../tests'
import { invoke } from '../utils'
import { albums, artists, current, search, total, tracks } from './search'

describe('search store', () => {
  it('triggers search and enqueue results', async () => {
    const text = faker.lorem.words()
    const totals = {
      albums: 3,
      artists: 0,
      tracks: 13
    }
    const totalSum = totals.artists + totals.albums + totals.tracks
    const size = 5
    const albumData = Array.from({ length: totals.albums }, (v, name) => ({
      name
    }))
    const artistData = Array.from({ length: totals.artists }, (v, name) => ({
      name
    }))
    const trackData = Array.from({ length: totals.tracks }, (v, path) => ({
      path,
      tags: {}
    }))
    invoke
      .mockResolvedValueOnce({
        totals,
        totalSum,
        size,
        from: 0,
        albums: albumData.slice(0, size),
        artists: artistData.slice(0, size),
        tracks: trackData.slice(0, size)
      })
      .mockResolvedValueOnce({
        totals,
        totalSum,
        size,
        from: size,
        albums: albumData.slice(size, size * 2),
        artists: artistData.slice(size, size * 2),
        tracks: trackData.slice(size, size * 2)
      })
      .mockResolvedValueOnce({
        totals,
        totalSum,
        size,
        from: size * 2,
        albums: albumData.slice(size * 2),
        artists: artistData.slice(size * 2),
        tracks: trackData.slice(size * 2)
      })

    expect(get(albums)).toEqual([])
    expect(get(artists)).toEqual([])
    expect(get(tracks)).toEqual([])
    expect(get(total)).toBe(0)
    expect(get(current)).toBeNull()

    search(text, size)
    await sleep(100)

    expect(get(albums)).toEqual(albumData)
    expect(get(artists)).toEqual(artistData)
    expect(get(tracks)).toEqual(trackData)
    expect(invoke).toHaveBeenCalledTimes(3)
    expect(invoke).toHaveBeenNthCalledWith(1, 'tracks.search', text, { size })
    expect(invoke).toHaveBeenNthCalledWith(2, 'tracks.search', text, {
      size,
      from: size
    })
    expect(invoke).toHaveBeenNthCalledWith(3, 'tracks.search', text, {
      size,
      from: size * 2
    })
    expect(get(total)).toEqual(totalSum)
    expect(get(current)).toEqual(text)
  })
})
