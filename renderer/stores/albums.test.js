'use strict'
import { get } from 'svelte/store'
import { albums, list, isListing } from './albums'
import { mockInvoke, sleep } from '../tests'

describe('albums store', () => {
  it('lists all albums', async () => {
    const total = 13
    const data = Array.from({ length: total }, (v, i) => i)
    mockInvoke.mockImplementation(
      async (channel, service, method, type, { size, from }) => ({
        total,
        size,
        from: from || 0,
        results: data.slice(from || 0, from + size)
      })
    )
    expect(get(albums)).toEqual([])
    expect(get(isListing)).toBe(false)
    await list()
    expect(get(isListing)).toBe(true)
    await sleep(100)
    expect(get(isListing)).toBe(false)
    expect(get(albums)).toEqual(data)
    expect(mockInvoke).toHaveBeenCalledWith(
      'remote',
      'tracks',
      'list',
      'album',
      expect.any(Object)
    )
  })
})
