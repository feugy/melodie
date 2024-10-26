import { get } from 'svelte/store'
import { describe, expect, it } from 'vitest'

import { sleep } from '../tests'
import { invoke } from '../utils'
import { albums, isListing, list } from './albums'

describe('albums store', () => {
  it('lists all albums', async () => {
    const total = 23
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
    expect(get(albums)).toEqual([])
    expect(get(isListing)).toBe(false)
    await list()
    expect(get(isListing)).toBe(true)
    await sleep(100)
    expect(get(isListing)).toBe(false)
    expect(get(albums)).toEqual(data)
    expect(invoke).toHaveBeenNthCalledWith(1, 'media.triggerAlbumsEnrichment')
    expect(invoke).toHaveBeenNthCalledWith(2, 'tracks.list', 'album', {
      size: 20
    })
    expect(invoke).toHaveBeenNthCalledWith(3, 'tracks.list', 'album', {
      size: 20,
      from: 20
    })
    expect(invoke).toHaveBeenCalledTimes(3)
  })
})
