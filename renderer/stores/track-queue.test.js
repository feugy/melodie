'use strict'

import { tick } from 'svelte'
import { get } from 'svelte/store'
import faker from 'faker'
import * as queue from './track-queue'

describe('track-queue store', () => {
  beforeEach(queue.clear)

  it('has initial state', () => {
    expect(get(queue.tracks)).toEqual([])
    expect(get(queue.current)).not.toBeDefined()
  })

  it('enqueues new tracks', async () => {
    const files = [
      faker.system.fileName(),
      faker.system.fileName(),
      faker.system.fileName()
    ]
    queue.add(files.slice(0, 2))
    queue.next()
    await tick()
    queue.add(files.slice(2))
    await tick()
    const { tracks, current } = queue
    expect(get(tracks)).toEqual(files)
    expect(get(current)).toEqual(files[1])
  })

  it('enqueues single track', async () => {
    const files = [
      faker.system.fileName(),
      faker.system.fileName(),
      faker.system.fileName()
    ]
    queue.add(files.slice(0, 2))
    queue.next()
    await tick()
    queue.add(files[2])
    await tick()
    const { tracks, current } = queue
    expect(get(tracks)).toEqual(files)
    expect(get(current)).toEqual(files[1])
  })

  it('plays new tracks', async () => {
    const files = [
      faker.system.fileName(),
      faker.system.fileName(),
      faker.system.fileName()
    ]
    queue.add(files.slice(0, 1))
    await tick()
    queue.add(files.slice(1), true)
    await tick()
    const { tracks, current } = queue
    expect(get(tracks)).toEqual(files.slice(1))
    expect(get(current)).toEqual(files[1])
  })

  it('plays single track', async () => {
    const files = [
      faker.system.fileName(),
      faker.system.fileName(),
      faker.system.fileName()
    ]
    queue.add(files.slice(0, 2))
    await tick()
    queue.add(files[2], true)
    await tick()
    const { tracks, current } = queue
    expect(get(tracks)).toEqual(files.slice(2, 3))
    expect(get(current)).toEqual(files[2])
  })

  describe('next', () => {
    const files = [
      faker.system.fileName(),
      faker.system.fileName(),
      faker.system.fileName()
    ]

    beforeEach(() => queue.add(files))

    it('goes to next and cycle', async () => {
      expect(get(queue.tracks)).toEqual(files)

      queue.next()
      await tick()
      expect(get(queue.current)).toEqual(files[1])

      queue.next()
      await tick()
      expect(get(queue.current)).toEqual(files[2])

      queue.next()
      await tick()
      expect(get(queue.current)).toEqual(files[0])

      queue.next()
      await tick()
      expect(get(queue.current)).toEqual(files[1])
    })
  })

  describe('previous', () => {
    const files = [
      faker.system.fileName(),
      faker.system.fileName(),
      faker.system.fileName()
    ]

    beforeEach(() => queue.add(files))

    it('goes to previous and cycle', async () => {
      expect(get(queue.tracks)).toEqual(files)

      queue.previous()
      await tick()
      expect(get(queue.current)).toEqual(files[2])

      queue.previous()
      await tick()
      expect(get(queue.current)).toEqual(files[1])

      queue.previous()
      await tick()
      expect(get(queue.current)).toEqual(files[0])

      queue.previous()
      await tick()
      expect(get(queue.current)).toEqual(files[2])
    })
  })
})
