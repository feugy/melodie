'use strict'
import { get } from 'svelte/store'
import { albums, list } from './albums'
import { mockInvoke, sleep } from '../tests'

describe('albums store', () => {
  it('lists all albums', async () => {
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
    expect(get(albums)).toEqual([])
    await list()
    await sleep(100)
    expect(get(albums)).toEqual(data)
    expect(mockInvoke).toHaveBeenCalledWith(
      'remote',
      'listEngine',
      'listAlbums',
      expect.any(Object)
    )
  })
})
