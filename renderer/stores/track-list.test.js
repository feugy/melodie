'use strict'
import { tick } from 'svelte'
import { get } from 'svelte/store'
import faker from 'faker'
import trackList from './track-list'

describe('track-list store', () => {
  beforeEach(trackList.clear)

  it('has initial state', () => {
    const { tracks, index, current } = get(trackList)
    expect(tracks).toEqual([])
    expect(index).toEqual(0)
    expect(current).not.toBeDefined()
  })

  it('adds new tracks', async () => {
    const files = [faker.system.fileName(), faker.system.fileName()]
    trackList.add(files)
    await tick()
    const { tracks, index, current } = get(trackList)
    expect(tracks).toEqual(files)
    expect(index).toEqual(0)
    expect(current).toEqual(files[0])
  })

  describe('next', () => {
    const files = [
      faker.system.fileName(),
      faker.system.fileName(),
      faker.system.fileName()
    ]

    beforeEach(() => trackList.add(files))

    it('goes to next and cycle', async () => {
      trackList.next()
      await tick()
      expect(get(trackList)).toEqual({
        tracks: files,
        index: 1,
        current: files[1]
      })

      trackList.next()
      await tick()
      expect(get(trackList)).toEqual({
        tracks: files,
        index: 2,
        current: files[2]
      })

      trackList.next()
      await tick()
      expect(get(trackList)).toEqual({
        tracks: files,
        index: 0,
        current: files[0]
      })
    })
  })

  describe('previous', () => {
    const files = [
      faker.system.fileName(),
      faker.system.fileName(),
      faker.system.fileName()
    ]

    beforeEach(() => trackList.add(files))

    it('goes to previous and cycle', async () => {
      trackList.previous()
      await tick()
      expect(get(trackList)).toEqual({
        tracks: files,
        index: 2,
        current: files[2]
      })

      trackList.previous()
      await tick()
      expect(get(trackList)).toEqual({
        tracks: files,
        index: 1,
        current: files[1]
      })

      trackList.previous()
      await tick()
      expect(get(trackList)).toEqual({
        tracks: files,
        index: 0,
        current: files[0]
      })
    })
  })
})
