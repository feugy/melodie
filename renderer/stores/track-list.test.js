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

  it('enqueues new tracks', async () => {
    const files = [
      faker.system.fileName(),
      faker.system.fileName(),
      faker.system.fileName()
    ]
    trackList.add(files.slice(0, 2))
    trackList.next()
    await tick()
    trackList.add(files.slice(2))
    await tick()
    const { tracks, index, current } = get(trackList)
    expect(tracks).toEqual(files)
    expect(index).toEqual(1)
    expect(current).toEqual(files[1])
  })

  it('enqueues single track', async () => {
    const files = [
      faker.system.fileName(),
      faker.system.fileName(),
      faker.system.fileName()
    ]
    trackList.add(files.slice(0, 2))
    trackList.next()
    await tick()
    trackList.add(files[2])
    await tick()
    const { tracks, index, current } = get(trackList)
    expect(tracks).toEqual(files)
    expect(index).toEqual(1)
    expect(current).toEqual(files[1])
  })

  it('plays new tracks', async () => {
    const files = [
      faker.system.fileName(),
      faker.system.fileName(),
      faker.system.fileName()
    ]
    trackList.add(files.slice(0, 1))
    await tick()
    trackList.add(files.slice(1), true)
    await tick()
    const { tracks, index, current } = get(trackList)
    expect(tracks).toEqual(files.slice(1))
    expect(index).toEqual(0)
    expect(current).toEqual(files[1])
  })

  it('plays single track', async () => {
    const files = [
      faker.system.fileName(),
      faker.system.fileName(),
      faker.system.fileName()
    ]
    trackList.add(files.slice(0, 2))
    await tick()
    trackList.add(files[2], true)
    await tick()
    const { tracks, index, current } = get(trackList)
    expect(tracks).toEqual(files.slice(2, 3))
    expect(index).toEqual(0)
    expect(current).toEqual(files[2])
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
