'use strict'
import { get } from 'svelte/store'
import { artists, list, isListing } from './artists'
import { mockInvoke, sleep } from '../tests'

describe('artists store', () => {
  it('lists all artists', async () => {
    const total = 13
    const data = Array.from({ length: total }, (v, i) => ({
      id: i,
      name: `${i}0`
    }))
    mockInvoke.mockImplementation(
      async (channel, service, method, type, params) =>
        params
          ? {
              total,
              size: params.size,
              from: params.from || 0,
              results: data.slice(
                params.from || 0,
                (params.from || 0) + params.size
              )
            }
          : null
    )
    expect(get(artists)).toEqual([])
    expect(get(isListing)).toBe(false)
    await list()
    expect(get(isListing)).toBe(true)
    await sleep(100)
    expect(get(isListing)).toBe(false)
    expect(get(artists)).toEqual(data)
    expect(mockInvoke).toHaveBeenNthCalledWith(
      1,
      'remote',
      'media',
      'triggerArtistsEnrichment'
    )
    expect(mockInvoke).toHaveBeenNthCalledWith(
      2,
      'remote',
      'tracks',
      'list',
      'artist',
      { size: 10 }
    )
    expect(mockInvoke).toHaveBeenNthCalledWith(
      3,
      'remote',
      'tracks',
      'list',
      'artist',
      { size: 10, from: 10 }
    )
    expect(mockInvoke).toHaveBeenCalledTimes(3)
  })
})
