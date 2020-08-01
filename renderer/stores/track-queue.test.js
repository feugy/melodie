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
    expect(get(queue.index)).toEqual(0)
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
    const { tracks, current, index } = queue
    expect(get(tracks)).toEqual(files)
    expect(get(index)).toEqual(1)
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
    const { tracks, current, index } = queue
    expect(get(tracks)).toEqual(files)
    expect(get(current)).toEqual(files[1])
    expect(get(index)).toEqual(1)
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
    const { tracks, current, index } = queue
    expect(get(tracks)).toEqual(files.slice(1))
    expect(get(current)).toEqual(files[1])
    expect(get(index)).toEqual(0)
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
    const { tracks, current, index } = queue
    expect(get(tracks)).toEqual(files.slice(2, 3))
    expect(get(current)).toEqual(files[2])
    expect(get(index)).toEqual(0)
  })

  describe('next', () => {
    beforeEach(() => queue.clear())

    it('goes to next and cycle', async () => {
      const files = [
        faker.system.fileName(),
        faker.system.fileName(),
        faker.system.fileName()
      ]
      queue.add(files)
      expect(get(queue.tracks)).toEqual(files)
      expect(get(queue.current)).toEqual(files[0])
      expect(get(queue.index)).toEqual(0)

      queue.next()
      await tick()
      expect(get(queue.current)).toEqual(files[1])
      expect(get(queue.index)).toEqual(1)

      queue.next()
      await tick()
      expect(get(queue.current)).toEqual(files[2])
      expect(get(queue.index)).toEqual(2)

      queue.next()
      await tick()
      expect(get(queue.current)).toEqual(files[0])
      expect(get(queue.index)).toEqual(0)

      queue.next()
      await tick()
      expect(get(queue.current)).toEqual(files[1])
      expect(get(queue.index)).toEqual(1)
    })

    it('supports duplicates', async () => {
      const files = [faker.system.fileName(), faker.system.fileName()]
      files.push(files[0], faker.system.fileName())

      queue.add(files)
      expect(get(queue.tracks)).toEqual(files)
      expect(get(queue.current)).toEqual(files[0])
      expect(get(queue.index)).toEqual(0)

      queue.next()
      await tick()
      expect(get(queue.current)).toEqual(files[1])
      expect(get(queue.index)).toEqual(1)

      queue.next()
      await tick()
      expect(get(queue.current)).toEqual(files[0])
      expect(get(queue.index)).toEqual(2)

      queue.next()
      await tick()
      expect(get(queue.current)).toEqual(files[3])
      expect(get(queue.index)).toEqual(3)

      queue.next()
      await tick()
      expect(get(queue.current)).toEqual(files[0])
      expect(get(queue.index)).toEqual(0)
    })
  })

  describe('previous', () => {
    it('goes to previous and cycle', async () => {
      const files = [
        faker.system.fileName(),
        faker.system.fileName(),
        faker.system.fileName()
      ]
      queue.add(files)
      expect(get(queue.tracks)).toEqual(files)
      expect(get(queue.current)).toEqual(files[0])
      expect(get(queue.index)).toEqual(0)

      queue.previous()
      await tick()
      expect(get(queue.current)).toEqual(files[2])
      expect(get(queue.index)).toEqual(2)

      queue.previous()
      await tick()
      expect(get(queue.current)).toEqual(files[1])
      expect(get(queue.index)).toEqual(1)

      queue.previous()
      await tick()
      expect(get(queue.current)).toEqual(files[0])
      expect(get(queue.index)).toEqual(0)

      queue.previous()
      await tick()
      expect(get(queue.current)).toEqual(files[2])
      expect(get(queue.index)).toEqual(2)
    })
  })

  describe('jumpTo', () => {
    beforeEach(() => queue.clear())

    it('goes forward and backward', async () => {
      const files = [
        faker.system.fileName(),
        faker.system.fileName(),
        faker.system.fileName()
      ]
      queue.add(files)
      expect(get(queue.tracks)).toEqual(files)
      expect(get(queue.current)).toEqual(files[0])
      expect(get(queue.index)).toEqual(0)

      queue.jumpTo(2)
      await tick()
      expect(get(queue.current)).toEqual(files[2])
      expect(get(queue.index)).toEqual(2)

      queue.jumpTo(0)
      await tick()
      expect(get(queue.current)).toEqual(files[0])
      expect(get(queue.index)).toEqual(0)
    })

    it('ignores out of bound index', async () => {
      const files = [faker.system.fileName(), faker.system.fileName()]

      queue.add(files)
      expect(get(queue.tracks)).toEqual(files)
      expect(get(queue.current)).toEqual(files[0])
      expect(get(queue.index)).toEqual(0)

      queue.jumpTo(10)
      await tick()
      expect(get(queue.current)).toEqual(files[0])
      expect(get(queue.index)).toEqual(0)

      queue.jumpTo(-1)
      await tick()
      expect(get(queue.current)).toEqual(files[0])
      expect(get(queue.index)).toEqual(0)
    })

    it('supports duplicates', async () => {
      const files = [faker.system.fileName(), faker.system.fileName()]
      files.push(files[0], faker.system.fileName())

      queue.add(files)
      expect(get(queue.tracks)).toEqual(files)
      expect(get(queue.current)).toEqual(files[0])
      expect(get(queue.index)).toEqual(0)

      queue.jumpTo(2)
      await tick()
      expect(get(queue.current)).toEqual(files[0])
      expect(get(queue.index)).toEqual(2)

      queue.jumpTo(1)
      await tick()
      expect(get(queue.current)).toEqual(files[1])
      expect(get(queue.index)).toEqual(1)
    })
  })
})
