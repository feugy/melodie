'use strict'
import { get } from 'svelte/store'
import { artists, list, isListing } from './artists'
import { invoke } from '../utils'
import { sleep } from '../tests'

describe('artists store', () => {
  it('lists all artists', async () => {
    const total = 13
    const data = Array.from({ length: total }, (v, i) => ({
      id: i,
      name: `${i}0`
    }))
    invoke.mockImplementation(async (invoked, type, params) =>
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
    expect(invoke).toHaveBeenNthCalledWith(1, 'media.triggerArtistsEnrichment')
    expect(invoke).toHaveBeenNthCalledWith(2, 'tracks.list', 'artist', {
      size: 10
    })
    expect(invoke).toHaveBeenNthCalledWith(3, 'tracks.list', 'artist', {
      size: 10,
      from: 10
    })
    expect(invoke).toHaveBeenCalledTimes(3)
  })
})
