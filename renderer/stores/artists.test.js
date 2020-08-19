'use strict'
import { get } from 'svelte/store'
import { artists, list } from './artists'
import { mockInvoke, sleep } from '../tests'

describe('artists store', () => {
  it('lists all artists', async () => {
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
    expect(get(artists)).toEqual([])
    await list()
    await sleep(100)
    expect(get(artists)).toEqual(data)
    expect(mockInvoke).toHaveBeenCalledWith(
      'remote',
      'listEngine',
      'listArtists',
      expect.any(Object)
    )
  })
})