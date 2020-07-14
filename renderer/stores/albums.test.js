'use strict'

import { get } from 'svelte/store'
import { albums as albumsStore, list } from './albums'
import { invoke } from '../utils'
jest.mock('../utils')

describe('albums store', () => {
  it('list all albums progressively', async () => {
    const total = 13
    const size = 5
    const data = Array.from({ length: total }, (v, i) => i)
    invoke
      .mockResolvedValueOnce({
        total,
        size,
        from: 0,
        results: data.slice(0, size)
      })
      .mockResolvedValueOnce({
        total,
        size,
        from: size,
        results: data.slice(size, size * 2)
      })
      .mockResolvedValueOnce({
        total,
        size,
        from: size * 2,
        results: data.slice(size * 2)
      })
    expect(get(albumsStore)).toEqual([])
    await list()
    // expect(get(albumsStore)).toEqual(data.slice(0, size))
    await new Promise(r => setTimeout(r, 100))
    expect(get(albumsStore)).toEqual(data)
    expect(invoke).toHaveBeenCalledTimes(3)
  })
})
