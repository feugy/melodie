'use strict'

import { tick } from 'svelte'
import { get } from 'svelte/store'
import { BehaviorSubject } from 'rxjs'
import faker from 'faker'
import { settings as mockedSettings } from './settings'
import { serverEmitter } from '../utils'
import { sleep } from '../tests'

jest.mock('./settings')

let queue
const settings = new BehaviorSubject({ enqueueBehaviour: {} })
mockedSettings.subscribe = settings.subscribe.bind(settings)

function difference(...arrays) {
  return arrays.reduce((a, b) => a.filter(c => !b.includes(c)))
}

function expectStoredList(queue) {
  expect(localStorage.getItem(queue.storageKey)).toEqual(
    JSON.stringify({
      list: get(queue.tracks),
      idx: get(queue.index)
    })
  )
}

describe('track-queue store', () => {
  beforeAll(async () => {
    queue = await import('./track-queue')
  })

  afterEach(() => queue.clear())

  it('has initial, empty state', () => {
    const { current, index, tracks, isShuffling } = queue
    expect(get(tracks)).toEqual([])
    expect(get(current)).not.toBeDefined()
    expect(get(index)).toEqual(0)
    expect(get(isShuffling)).toEqual(false)
    expectStoredList(queue)
  })

  describe('add', () => {
    describe('given settings.enqueueBehaviour.clearBefore is true', () => {
      beforeAll(() => {
        settings.next({ enqueueBehaviour: { clearBefore: true } })
      })

      it('enqueues new tracks', async () => {
        const { current, index, tracks, add, playNext } = queue
        const files = [
          { id: 1, path: faker.system.fileName() },
          { id: 2, path: faker.system.fileName() },
          { id: 3, path: faker.system.fileName() }
        ]
        add(files.slice(0, 2))
        playNext()
        await tick()
        add(files.slice(2))
        await tick()

        expect(get(tracks)).toEqual(files)
        expect(get(index)).toEqual(1)
        expect(get(current)).toEqual(files[1])
        expectStoredList(queue)
      })

      it('enqueues single track', async () => {
        const { current, index, tracks, add, playNext } = queue
        const files = [
          { id: 1, path: faker.system.fileName() },
          { id: 2, path: faker.system.fileName() },
          { id: 3, path: faker.system.fileName() }
        ]
        add(files.slice(0, 2))
        playNext()
        await tick()
        add(files[2])
        await tick()

        expect(get(tracks)).toEqual(files)
        expect(get(current)).toEqual(files[1])
        expect(get(index)).toEqual(1)
        expectStoredList(queue)
      })

      it('plays new tracks', async () => {
        const { current, index, tracks, add } = queue
        const files = [
          { id: 1, path: faker.system.fileName() },
          { id: 2, path: faker.system.fileName() },
          { id: 3, path: faker.system.fileName() }
        ]
        add(files.slice(0, 1))
        await tick()
        add(files.slice(1), true)
        await tick()

        expect(get(tracks)).toEqual(files.slice(1))
        expect(get(current)).toEqual(files[1])
        expect(get(index)).toEqual(0)
        expectStoredList(queue)
      })

      it('plays single track', async () => {
        const { current, index, tracks, add } = queue
        const files = [
          { id: 1, path: faker.system.fileName() },
          { id: 2, path: faker.system.fileName() },
          { id: 3, path: faker.system.fileName() }
        ]
        add(files.slice(0, 2))
        await tick()
        add(files[2], true)
        await tick()

        expect(get(tracks)).toEqual(files.slice(2, 3))
        expect(get(current)).toEqual(files[2])
        expect(get(index)).toEqual(0)
        expectStoredList(queue)
      })
    })

    describe('given settings.enqueueBehaviour.clearBefore is false', () => {
      beforeAll(() => {
        settings.next({ enqueueBehaviour: { clearBefore: false } })
      })

      it('enqueues new tracks', async () => {
        const { current, index, tracks, add, playNext } = queue
        const files = [
          { id: 1, path: faker.system.fileName() },
          { id: 2, path: faker.system.fileName() },
          { id: 3, path: faker.system.fileName() }
        ]
        add(files.slice(0, 2))
        playNext()
        await tick()
        add(files.slice(2))
        await tick()

        expect(get(tracks)).toEqual(files)
        expect(get(index)).toEqual(1)
        expect(get(current)).toEqual(files[1])
        expectStoredList(queue)
      })

      it('plays new tracks', async () => {
        const { current, index, tracks, add } = queue
        const files = [
          { id: 1, path: faker.system.fileName() },
          { id: 2, path: faker.system.fileName() },
          { id: 3, path: faker.system.fileName() }
        ]
        add(files.slice(0, 1))
        await tick()
        add(files.slice(1), true)
        await tick()

        expect(get(tracks)).toEqual(files)
        expect(get(current)).toEqual(files[1])
        expect(get(index)).toEqual(1)
        expectStoredList(queue)
      })
    })
  })

  describe('next', () => {
    it('does nothing on empty queue', async () => {
      const { current, index, tracks, playNext } = queue
      playNext()
      await tick()

      expect(get(tracks)).toEqual([])
      expect(get(current)).not.toBeDefined()
      expect(get(index)).toEqual(0)
    })

    it('goes to next and cycle', async () => {
      const { current, index, tracks, add, playNext } = queue
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() },
        { id: 3, path: faker.system.fileName() }
      ]
      add(files)
      expect(get(tracks)).toEqual(files)
      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(0)

      playNext()
      await tick()
      expect(get(current)).toEqual(files[1])
      expect(get(index)).toEqual(1)

      playNext()
      await tick()
      expect(get(current)).toEqual(files[2])
      expect(get(index)).toEqual(2)

      playNext()
      await tick()
      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(0)

      queue.playNext()
      await tick()
      expect(get(queue.current)).toEqual(files[1])
      expect(get(queue.index)).toEqual(1)
      expectStoredList(queue)
    })

    it('supports duplicates', async () => {
      const { current, index, tracks, add, playNext } = queue
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() }
      ]
      files.push(files[0], { id: 3, path: faker.system.fileName() })

      add(files)
      expect(get(tracks)).toEqual(files)
      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(0)

      playNext()
      await tick()
      expect(get(current)).toEqual(files[1])
      expect(get(index)).toEqual(1)

      playNext()
      await tick()
      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(2)

      playNext()
      await tick()
      expect(get(current)).toEqual(files[3])
      expect(get(index)).toEqual(3)

      playNext()
      await tick()
      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(0)
    })
  })

  describe('previous', () => {
    it('does nothing on empty queue', async () => {
      const { current, index, tracks, playPrevious } = queue
      playPrevious()
      await tick()

      expect(get(tracks)).toEqual([])
      expect(get(current)).not.toBeDefined()
      expect(get(index)).toEqual(0)
    })

    it('goes to previous and cycle', async () => {
      const { current, index, tracks, add, playPrevious } = queue
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() },
        { id: 3, path: faker.system.fileName() }
      ]
      add(files)
      expect(get(tracks)).toEqual(files)
      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(0)

      playPrevious()
      await tick()
      expect(get(current)).toEqual(files[2])
      expect(get(index)).toEqual(2)

      playPrevious()
      await tick()
      expect(get(current)).toEqual(files[1])
      expect(get(index)).toEqual(1)

      playPrevious()
      await tick()
      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(0)

      playPrevious()
      await tick()
      expect(get(current)).toEqual(files[2])
      expect(get(index)).toEqual(2)
      expectStoredList(queue)
    })
  })

  describe('jumpTo', () => {
    it('does nothing on empty queue', async () => {
      const { current, index, tracks, jumpTo } = queue
      jumpTo(1)
      await tick()

      expect(get(tracks)).toEqual([])
      expect(get(current)).not.toBeDefined()
      expect(get(index)).toEqual(0)
    })

    it('goes forward and backward', async () => {
      const { current, index, tracks, add, jumpTo } = queue
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() },
        { id: 3, path: faker.system.fileName() }
      ]
      add(files)
      expect(get(tracks)).toEqual(files)
      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(0)

      jumpTo(2)
      await tick()
      expect(get(current)).toEqual(files[2])
      expect(get(index)).toEqual(2)

      jumpTo(0)
      await tick()
      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(0)
      expectStoredList(queue)
    })

    it('ignores out of bound index', async () => {
      const { current, index, tracks, add, jumpTo } = queue
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() }
      ]

      add(files)
      expect(get(tracks)).toEqual(files)
      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(0)

      jumpTo(10)
      await tick()
      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(0)

      jumpTo(-1)
      await tick()
      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(0)
    })

    it('supports duplicates', async () => {
      const { current, index, tracks, add, jumpTo } = queue
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() }
      ]
      files.push(files[0], faker.system.fileName())

      add(files)
      expect(get(tracks)).toEqual(files)
      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(0)

      jumpTo(2)
      await tick()
      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(2)

      jumpTo(1)
      await tick()
      expect(get(current)).toEqual(files[1])
      expect(get(index)).toEqual(1)
    })
  })

  describe('move', () => {
    const files = [
      { id: 1, path: faker.system.fileName() },
      { id: 2, path: faker.system.fileName() },
      { id: 3, path: faker.system.fileName() },
      { id: 4, path: faker.system.fileName() }
    ]

    beforeEach(async () => {
      queue.add(files.concat())
      await tick()
    })

    it('does nothing on empty queue', async () => {
      const { current, index, tracks, move, clear } = queue
      clear()
      move(1, 2)
      await tick()

      expect(get(tracks)).toEqual([])
      expect(get(current)).not.toBeDefined()
      expect(get(index)).toEqual(0)
    })

    it('moves track before current one', async () => {
      const { current, index, tracks, move, jumpTo } = queue
      jumpTo(2)
      await tick()
      expect(get(current)).toEqual(files[2])
      expect(get(index)).toEqual(2)

      move(3, 0)
      await tick()

      expect(get(tracks)).toEqual([files[3], files[0], files[1], files[2]])
      expect(get(current)).toEqual(files[2])
      expect(get(index)).toEqual(3)
      expectStoredList(queue)
    })

    it('moves track backward, after current', async () => {
      const { current, index, tracks, move } = queue
      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(0)

      move(2, 1)
      await tick()

      expect(get(tracks)).toEqual([files[0], files[2], files[1], files[3]])
      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(0)
      expectStoredList(queue)
    })

    it('moves track forward, after current', async () => {
      const { current, index, tracks, move } = queue
      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(0)

      move(1, 3)
      await tick()

      expect(get(tracks)).toEqual([files[0], files[2], files[3], files[1]])
      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(0)
      expectStoredList(queue)
    })

    it('moves track backward, before current', async () => {
      const { current, index, tracks, move, jumpTo } = queue
      jumpTo(2)
      await tick()
      expect(get(current)).toEqual(files[2])
      expect(get(index)).toEqual(2)

      move(1, 0)
      await tick()

      expect(get(tracks)).toEqual([files[1], files[0], files[2], files[3]])
      expect(get(current)).toEqual(files[2])
      expect(get(index)).toEqual(2)
      expectStoredList(queue)
    })

    it('moves track forward, after current', async () => {
      const { current, index, tracks, move, jumpTo } = queue
      jumpTo(2)
      await tick()
      expect(get(current)).toEqual(files[2])
      expect(get(index)).toEqual(2)

      move(0, 1)
      await tick()

      expect(get(tracks)).toEqual([files[1], files[0], files[2], files[3]])
      expect(get(current)).toEqual(files[2])
      expect(get(index)).toEqual(2)
      expectStoredList(queue)
    })

    it('moves track after current one', async () => {
      const { current, index, tracks, move, jumpTo } = queue
      jumpTo(2)
      await tick()

      expect(get(current)).toEqual(files[2])
      expect(get(index)).toEqual(2)

      move(0, 3)
      await tick()

      expect(get(tracks)).toEqual([files[1], files[2], files[3], files[0]])
      expect(get(current)).toEqual(files[2])
      expect(get(index)).toEqual(1)
      expectStoredList(queue)
    })

    it('ignores invalid boundaries', async () => {
      const { current, index, tracks, move } = queue
      move(-1, 2)
      await tick()

      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(0)
      expect(get(tracks)).toEqual(files)

      move(10, 2)
      await tick()

      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(0)
      expect(get(tracks)).toEqual(files)

      move(2, -1)
      await tick()

      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(0)
      expect(get(tracks)).toEqual(files)

      move(2, 10)
      await tick()

      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(0)
      expect(get(tracks)).toEqual(files)
      expectStoredList(queue)
    })
  })

  describe('remove', () => {
    it('does nothing on empty queue', async () => {
      const { current, index, tracks, remove } = queue
      remove(1)
      await tick()

      expect(get(tracks)).toEqual([])
      expect(get(index)).toEqual(0)
      expect(get(current)).not.toBeDefined()
    })

    it('removes future track', async () => {
      const { current, index, tracks, add, remove } = queue
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() },
        { id: 3, path: faker.system.fileName() }
      ]
      add(files)
      expect(get(tracks)).toEqual(files)
      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(0)

      remove(2)
      await tick()
      expect(get(tracks)).toEqual(files.slice(0, 2))
      expect(get(index)).toEqual(0)
      expect(get(current)).toEqual(files[0])
      expectStoredList(queue)
    })

    it('removes current track', async () => {
      const { current, index, tracks, add, playNext, remove } = queue
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() },
        { id: 3, path: faker.system.fileName() }
      ]
      add(files)
      playNext()
      expect(get(tracks)).toEqual(files)
      expect(get(current)).toEqual(files[1])
      expect(get(index)).toEqual(1)

      remove(1)
      await tick()
      expect(get(tracks)).toEqual([...files.slice(0, 1), ...files.slice(2)])
      expect(get(index)).toEqual(1)
      expect(get(current)).toEqual(files[2])
      expectStoredList(queue)
    })

    it('removes last current track', async () => {
      const { current, index, tracks, add, jumpTo, remove } = queue
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() },
        { id: 3, path: faker.system.fileName() }
      ]
      add(files)
      jumpTo(2)
      expect(get(tracks)).toEqual(files)
      expect(get(current)).toEqual(files[2])
      expect(get(index)).toEqual(2)

      remove(2)
      await tick()
      expect(get(tracks)).toEqual([...files.slice(0, 2)])
      expect(get(index)).toEqual(0)
      expect(get(current)).toEqual(files[0])
      expectStoredList(queue)
    })

    it('removes past track', async () => {
      const { current, index, tracks, add, jumpTo, remove } = queue
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() },
        { id: 3, path: faker.system.fileName() }
      ]
      add(files)
      jumpTo(2)
      expect(get(tracks)).toEqual(files)
      expect(get(current)).toEqual(files[2])
      expect(get(index)).toEqual(2)

      remove(1)
      await tick()
      expect(get(tracks)).toEqual([...files.slice(0, 1), ...files.slice(2)])
      expect(get(index)).toEqual(1)
      expect(get(current)).toEqual(files[2])
      expectStoredList(queue)
    })

    it('ignores out of bound index', async () => {
      const { current, index, tracks, add, remove } = queue
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() }
      ]

      add(files)
      expect(get(tracks)).toEqual(files)
      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(0)

      remove(10)
      await tick()
      expect(get(index)).toEqual(0)
      expect(get(current)).toEqual(files[0])

      remove(-1)
      await tick()
      expect(get(index)).toEqual(0)
      expect(get(current)).toEqual(files[0])
    })

    it('supports duplicates', async () => {
      const { current, index, tracks, add, remove } = queue
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() }
      ]
      files.push(files[0], { id: 3, path: faker.system.fileName() })

      add(files)
      expect(get(tracks)).toEqual(files)
      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(0)

      remove(2)
      await tick()
      expect(get(tracks)).toEqual([...files.slice(0, 2), ...files.slice(3)])
      expect(get(index)).toEqual(0)
    })
  })

  describe('given incoming changes', () => {
    it('does not change empty queue', async () => {
      const { current, index, tracks } = queue
      serverEmitter.next({
        event: 'track-changes',
        args: [
          {
            id: 1,
            path: faker.system.fileName()
          }
        ]
      })
      await tick()

      expect(get(tracks)).toEqual([])
      expect(get(index)).toEqual(0)
      expect(get(current)).not.toBeDefined()
    })

    it('does not change queue on un-queued track', async () => {
      const { current, index, tracks, add } = queue
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() }
      ]
      add(files)

      serverEmitter.next({
        event: 'track-changes',
        args: [
          {
            id: 3,
            path: faker.system.fileName()
          }
        ]
      })
      await tick()

      expect(get(tracks)).toEqual(files)
      expect(get(index)).toEqual(0)
      expect(get(current)).toEqual(files[0])
      expectStoredList(queue)
    })

    it('updates all occurences of changed track', async () => {
      const { current, index, tracks, add } = queue
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() }
      ]
      files.push(files[0], { id: 3, path: faker.system.fileName() })
      add(files)
      await tick()
      expect(get(tracks)).toEqual(files)
      expect(get(index)).toEqual(0)
      expect(get(current)).toEqual(files[0])

      const changed = { id: 1, path: faker.system.fileName() }
      serverEmitter.next({ event: 'track-changes', args: [changed] })
      await tick()

      expect(get(tracks)).toEqual([changed, files[1], changed, files[3]])
      expect(get(index)).toEqual(0)
      expect(get(current)).toEqual(changed)
      expectStoredList(queue)
    })

    it('updates all occurences of changed track in shuffled list', async () => {
      const { current, index, tracks, add, shuffle, unshuffle } = queue
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() }
      ]
      files.push(files[0], { id: 3, path: faker.system.fileName() })
      add(files)
      shuffle()
      await tick()
      expect(get(index)).toEqual(0)
      expect(get(current)).toEqual(files[0])

      const changed = { id: 1, path: faker.system.fileName() }
      serverEmitter.next({ event: 'track-changes', args: [changed] })
      await tick()

      expect(get(tracks)).toEqual(
        expect.arrayContaining([changed, files[1], files[3]])
      )
      expect(get(tracks)).not.toEqual(expect.arrayContaining([files[0]]))
      expect(get(index)).toEqual(0)
      expect(get(current)).toEqual(changed)

      unshuffle()
      await tick()

      expect(get(tracks)).toEqual([changed, files[1], changed, files[3]])
      expect(get(index)).toEqual(0)
      expect(get(current)).toEqual(changed)
      expectStoredList(queue)
    })
  })

  describe('given incoming removal', () => {
    it('does not change empty queue', async () => {
      serverEmitter.next({ event: 'track-removals', args: [1] })
      const { current, index, tracks } = queue
      await tick()

      expect(get(tracks)).toEqual([])
      expect(get(index)).toEqual(0)
      expect(get(current)).not.toBeDefined()
    })

    it('does not change queue on un-queued track', async () => {
      const { current, index, tracks, add } = queue
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() }
      ]
      add(files)

      serverEmitter.next({ event: 'track-removals', args: [3] })
      await tick()

      expect(get(tracks)).toEqual(files)
      expect(get(index)).toEqual(0)
      expect(get(current)).toEqual(files[0])
      expectStoredList(queue)
    })

    it('removes single occurences of removed track', async () => {
      const { current, index, tracks, add, playNext } = queue
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() },
        { id: 3, path: faker.system.fileName() }
      ]
      add(files)
      playNext()
      await tick()

      expect(get(tracks)).toEqual(files)
      expect(get(index)).toEqual(1)
      expect(get(current)).toEqual(files[1])

      serverEmitter.next({ event: 'track-removals', args: [files[1].id] })
      await tick()

      expect(get(tracks)).toEqual([files[0], files[2]])
      expect(get(index)).toEqual(1)
      expect(get(current)).toEqual(files[2])
      expectStoredList(queue)
    })

    it('removes all occurences of removed track', async () => {
      const { current, index, tracks, add, playNext } = queue
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() }
      ]
      files.push(files[1], { id: 3, path: faker.system.fileName() })
      add(files)
      playNext()
      await tick()

      expect(get(tracks)).toEqual(files)
      expect(get(index)).toEqual(1)
      expect(get(current)).toEqual(files[1])

      serverEmitter.next({ event: 'track-removals', args: [files[1].id] })
      await tick()

      expect(get(tracks)).toEqual([files[0], files[3]])
      expect(get(index)).toEqual(1)
      expect(get(current)).toEqual(files[3])
      expectStoredList(queue)
    })

    it('removes all occurences of removed track in shuffled list', async () => {
      const { current, index, tracks, add, jumpTo, shuffle, unshuffle } = queue
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() }
      ]
      files.push(files[1], { id: 3, path: faker.system.fileName() })
      add(files)
      jumpTo(1)
      shuffle()
      await tick()

      expect(get(index)).toEqual(0)
      expect(get(current)).toEqual(files[1])

      serverEmitter.next({ event: 'track-removals', args: [files[1].id] })
      await tick()

      expect(get(tracks)).toEqual(expect.arrayContaining([files[0], files[3]]))
      expect(get(tracks)).not.toEqual(expect.arrayContaining([files[1]]))
      expect(get(index)).toEqual(0)

      unshuffle()
      await tick()

      expect(get(tracks)).toEqual([files[0], files[3]])
      expectStoredList(queue)
    })
  })

  describe('shuffle', () => {
    const files = [
      { id: 1, path: faker.system.fileName() },
      { id: 2, path: faker.system.fileName() },
      { id: 3, path: faker.system.fileName() },
      { id: 4, path: faker.system.fileName() },
      { id: 5, path: faker.system.fileName() },
      { id: 6, path: faker.system.fileName() },
      { id: 7, path: faker.system.fileName() },
      { id: 8, path: faker.system.fileName() }
    ]

    const order = [1, 2, 3, 4, 5, 6, 7, 8]

    beforeEach(async () => {
      queue.add(files)
      await tick()
    })

    afterEach(() => queue.unshuffle())

    it('randomize the order of all tracks when turned on', async () => {
      const { current, index, isShuffling, playNext, tracks, shuffle } = queue

      playNext()
      await tick()

      expect(get(tracks)).toEqual(files)
      expect(get(tracks).map(({ id }) => id)).toEqual(order)
      expect(get(index)).toEqual(1)
      expect(get(current)).toEqual(files[1])

      shuffle()
      await tick()

      expect(get(tracks)).toEqual(expect.arrayContaining(files))
      expect(get(current)).toEqual(files[1])
      expect(get(index)).toEqual(0)
      expect(get(isShuffling)).toEqual(true)
      expect(get(tracks).map(({ id }) => id)).not.toEqual(order)
      expectStoredList(queue)
    })

    it('revert to original order when turned off, and keep current track', async () => {
      const {
        current,
        index,
        isShuffling,
        playNext,
        tracks,
        shuffle,
        unshuffle
      } = queue

      playNext()
      await tick()
      expect(get(tracks).map(({ id }) => id)).toEqual(order)
      expect(get(index)).toEqual(1)
      expect(get(current)).toEqual(files[1])

      shuffle()
      playNext()
      playNext()
      await tick()

      const currentShuffled = get(current)
      expect(get(index)).toEqual(2)
      expect(get(isShuffling)).toEqual(true)

      unshuffle()
      await tick()

      expect(get(tracks)).toEqual(files)
      expect(get(current)).toEqual(currentShuffled)
      expect(get(index)).toEqual(files.indexOf(currentShuffled))
      expect(get(isShuffling)).toEqual(false)
      expectStoredList(queue)
    })

    it('does not retain removed tracks when turned off', async () => {
      const {
        current,
        index,
        isShuffling,
        jumpTo,
        tracks,
        shuffle,
        remove,
        unshuffle
      } = queue
      expect(get(tracks).map(({ id }) => id)).toEqual(order)

      jumpTo(4)
      expect(get(index)).toEqual(4)
      expect(get(current)).toEqual(files[4])

      shuffle()
      jumpTo(2)
      const currentShuffled = get(current)

      remove(6)
      await tick()

      expect(get(index)).toEqual(2)
      expect(get(current)).toEqual(currentShuffled)

      remove(1)
      await tick()

      expect(get(index)).toEqual(1)
      expect(get(current)).toEqual(currentShuffled)
      const removed = difference(files, get(tracks)).map(({ id }) => id)
      expect(removed).toHaveLength(2)
      const remainingFiles = files.filter(({ id }) => !removed.includes(id))

      unshuffle()
      await tick()

      expect(get(tracks)).toHaveLength(files.length - removed.length)
      expect(get(tracks)).toEqual(remainingFiles)
      expect(get(current)).toEqual(currentShuffled)
      expect(get(index)).toEqual(remainingFiles.indexOf(currentShuffled))
      expect(get(isShuffling)).toEqual(false)
      expectStoredList(queue)
    })

    it('ignores subsequent shuffles', async () => {
      const { current, index, isShuffling, tracks, shuffle } = queue

      shuffle()
      await tick()

      const currentShuffled = get(current)
      const shuffled = get(tracks)
      expect(get(index)).toEqual(0)
      expect(get(isShuffling)).toEqual(true)

      shuffle()
      await tick()

      expect(get(current)).toEqual(currentShuffled)
      expect(get(index)).toEqual(0)
      expect(get(tracks)).toEqual(shuffled)
      expect(get(isShuffling)).toEqual(true)

      shuffle()
      await tick()

      expect(get(current)).toEqual(currentShuffled)
      expect(get(index)).toEqual(0)
      expect(get(tracks)).toEqual(shuffled)
      expect(get(isShuffling)).toEqual(true)
    })

    it('can shuffle and unshuffle empty list', async () => {
      const { clear, current, index, isShuffling, tracks, shuffle, unshuffle } =
        queue

      clear()
      await tick()

      expect(get(current)).toBeUndefined()
      expect(get(index)).toEqual(0)
      expect(get(tracks)).toEqual([])
      expect(get(isShuffling)).toEqual(false)

      shuffle()
      await tick()

      expect(get(current)).toBeUndefined()
      expect(get(index)).toEqual(0)
      expect(get(tracks)).toEqual([])
      expect(get(isShuffling)).toEqual(true)

      unshuffle()
      await tick()

      expect(get(current)).toBeUndefined()
      expect(get(index)).toEqual(0)
      expect(get(tracks)).toEqual([])
      expect(get(isShuffling)).toEqual(false)
    })

    it('ignores unshuffle on non-shuffled list', async () => {
      const { current, index, isShuffling, tracks, unshuffle } = queue

      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(0)
      expect(get(tracks)).toEqual(files)
      expect(get(isShuffling)).toEqual(false)

      unshuffle()
      await tick()

      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(0)
      expect(get(tracks)).toEqual(files)
      expect(get(isShuffling)).toEqual(false)
    })

    it('ignores subsequent unshuffles', async () => {
      const { current, index, isShuffling, tracks, shuffle, unshuffle } = queue

      shuffle()
      await tick()

      expect(get(index)).toEqual(0)
      expect(get(isShuffling)).toEqual(true)

      unshuffle()
      await tick()

      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(0)
      expect(get(tracks)).toEqual(files)
      expect(get(isShuffling)).toEqual(false)

      unshuffle()
      await tick()

      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(0)
      expect(get(tracks)).toEqual(files)
      expect(get(isShuffling)).toEqual(false)
    })

    it('clears shuffled and unshuffled list', async () => {
      const { current, index, isShuffling, tracks, shuffle, clear } = queue

      shuffle()

      expect(get(current)).toEqual(files[0])
      expect(get(index)).toEqual(0)
      expect(get(tracks)).toEqual(expect.arrayContaining(files))
      expect(get(isShuffling)).toEqual(true)

      clear()
      await tick()

      expect(get(current)).toBeUndefined()
      expect(get(index)).toEqual(0)
      expect(get(tracks)).toEqual([])
      expect(get(isShuffling)).toEqual(true)
    })

    it('adds new tracks at random position when turned on', async () => {
      const added = [
        { id: 9, path: faker.system.fileName() },
        { id: 10, path: faker.system.fileName() },
        { id: 11, path: faker.system.fileName() },
        { id: 12, path: faker.system.fileName() }
      ]
      const { current, index, isShuffling, tracks, shuffle, add, jumpTo } =
        queue

      shuffle()
      jumpTo(3)

      const currentShuffled = get(current)
      expect(get(index)).toEqual(3)
      expect(get(tracks)).toEqual(expect.arrayContaining(files))
      expect(get(isShuffling)).toEqual(true)

      add(added)
      await tick()

      expect(get(index)).toEqual(3)
      expect(get(current)).toEqual(currentShuffled)
      const content = get(tracks)
      expect(content).toHaveLength(files.length + added.length)
      expect(content).toEqual(expect.arrayContaining(files))
      expect(content).toEqual(expect.arrayContaining(added))
      for (const track of added) {
        expect(content.indexOf(track) > 3).toBe(true)
      }
      expect(get(isShuffling)).toEqual(true)
      expectStoredList(queue)
    })

    it('keeps added tracks at the end when turned off', async () => {
      const added = [
        { id: 9, path: faker.system.fileName() },
        { id: 10, path: faker.system.fileName() },
        { id: 11, path: faker.system.fileName() },
        { id: 12, path: faker.system.fileName() }
      ]
      const { current, index, isShuffling, tracks, shuffle, add, unshuffle } =
        queue

      shuffle()
      add(added)

      unshuffle()
      await tick()

      expect(get(index)).toEqual(0)
      expect(get(current)).toEqual(files[0])
      const content = get(tracks)
      expect(content).toHaveLength(files.length + added.length)
      expect(content).toEqual([...files, ...added])
      expect(get(isShuffling)).toEqual(false)
      expectStoredList(queue)
    })

    it('add randomized tracks to empty shuffled list', async () => {
      const {
        current,
        index,
        isShuffling,
        tracks,
        shuffle,
        add,
        unshuffle,
        clear
      } = queue

      shuffle()
      clear()
      await tick()

      expect(get(index)).toEqual(0)
      expect(get(current)).toBeUndefined()
      expect(get(tracks)).toEqual([])
      expect(get(isShuffling)).toEqual(true)

      const added = [
        { id: 9, path: faker.system.fileName() },
        { id: 10, path: faker.system.fileName() },
        { id: 11, path: faker.system.fileName() },
        { id: 12, path: faker.system.fileName() }
      ]
      add(added)
      await tick()

      expect(get(index)).toEqual(0)
      expect(get(tracks)).toHaveLength(added.length)
      expect(get(tracks)).toEqual(expect.arrayContaining(added))

      unshuffle()
      await tick()
      expect(get(tracks)).toEqual(added)
      expect(get(isShuffling)).toEqual(false)
      expectStoredList(queue)
    })

    it('restores moved track to their original place when turned off', async () => {
      const {
        current,
        index,
        isShuffling,
        tracks,
        shuffle,
        move,
        unshuffle,
        jumpTo
      } = queue

      shuffle()
      jumpTo(3)
      await tick()

      const content = [...get(tracks)]
      const currentShuffled = get(current)
      expect(get(index)).toEqual(3)
      expect(get(isShuffling)).toEqual(true)

      move(1, 6)
      await tick()

      expect(get(current)).toEqual(currentShuffled)
      expect(get(index)).toEqual(2)
      expect(get(tracks)).toEqual([
        content[0],
        content[2],
        currentShuffled,
        ...content.slice(4, 7),
        content[1],
        content[7]
      ])

      unshuffle()
      await tick()

      expect(get(current)).toEqual(currentShuffled)
      expect(get(queue.tracks)).toEqual(files)
      expect(get(isShuffling)).toEqual(false)
      expectStoredList(queue)
    })
  })

  describe('createClickToAddObservable', () => {
    let clicks$
    let clicksSub

    const files = [
      { id: 1, path: faker.system.fileName() },
      { id: 2, path: faker.system.fileName() },
      { id: 3, path: faker.system.fileName() }
    ]

    const file = { id: 4, path: faker.system.fileName() }

    beforeAll(() => {
      clicks$ = queue.createClickToAddObservable()
    })

    beforeEach(() => {
      queue.add(files)
      queue.jumpTo(1)
      clicksSub = clicks$.subscribe()
    })

    afterEach(() => clicksSub.unsubscribe())

    describe('given settings.enqueueBehaviour.onClick is true', () => {
      beforeAll(() => {
        settings.next({
          enqueueBehaviour: { onClick: true, clearBefore: true }
        })
      })

      it('enqueues track on single click', async () => {
        clicks$.next(file)
        await sleep(300)

        expect(get(queue.tracks)).toEqual([...files, file])
        expect(get(queue.current)).toEqual(files[1])
        expect(get(queue.index)).toEqual(1)
      })

      it('plays track on double click', async () => {
        clicks$.next(file)
        clicks$.next(file)
        await sleep(300)

        expect(get(queue.tracks)).toEqual([file])
        expect(get(queue.current)).toEqual(file)
        expect(get(queue.index)).toEqual(0)
      })
    })

    describe('given settings.enqueueBehaviour.onClick is false', () => {
      beforeAll(() => {
        settings.next({
          enqueueBehaviour: { onClick: false, clearBefore: true }
        })
      })

      it('enqueues track on double click', async () => {
        clicks$.next(file)
        clicks$.next(file)
        await sleep(300)

        expect(get(queue.tracks)).toEqual([...files, file])
        expect(get(queue.current)).toEqual(files[1])
        expect(get(queue.index)).toEqual(1)
      })

      it('plays track on simple click', async () => {
        clicks$.next(file)
        await sleep(300)

        expect(get(queue.tracks)).toEqual([file])
        expect(get(queue.current)).toEqual(file)
        expect(get(queue.index)).toEqual(0)
      })
    })
  })

  describe('given incoming tracks from Main process', () => {
    const played = [
      { id: 1, path: faker.system.fileName() },
      { id: 2, path: faker.system.fileName() },
      { id: 3, path: faker.system.fileName() }
    ]

    beforeAll(() => {
      settings.next({
        enqueueBehaviour: { onClick: false, clearBefore: false }
      })
    })

    beforeEach(() => queue.clear())

    it('immediately plays received tracks', async () => {
      serverEmitter.next({ event: 'play-tracks', args: played })
      await tick()

      expect(get(queue.tracks)).toEqual(played)
      expect(get(queue.current)).toEqual(played[0])
      expect(get(queue.index)).toEqual(0)
    })

    it('adds received tracks to the queue and play them', async () => {
      const files = [
        { id: 4, path: faker.system.fileName() },
        { id: 5, path: faker.system.fileName() },
        { id: 6, path: faker.system.fileName() }
      ]
      queue.add(files)

      serverEmitter.next({ event: 'play-tracks', args: played })
      await tick()

      expect(get(queue.tracks)).toEqual([...files, ...played])
      expect(get(queue.current)).toEqual(played[0])
      expect(get(queue.index)).toEqual(files.length)
    })
  })

  describe('given previously stored list', () => {
    beforeEach(jest.resetModules)

    it('restores initial state', async () => {
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() },
        { id: 3, path: faker.system.fileName() }
      ]
      localStorage.setItem(
        queue.storageKey,
        JSON.stringify({ list: files, idx: 1 })
      )
      queue = await import('./track-queue')
      expect(get(queue.tracks)).toEqual(files)
      expect(get(queue.current)).toEqual(files[1])
      expect(get(queue.index)).toEqual(1)
      expect(get(queue.isShuffling)).toEqual(false)
      expectStoredList(queue)
    })

    it('ignores invalid stored initial state', async () => {
      localStorage.setItem(queue.storageKey, 'unparseable')
      queue = await import('./track-queue')
      expect(get(queue.tracks)).toEqual([])
      expect(get(queue.current)).toBeUndefined()
      expect(get(queue.index)).toEqual(0)
      expect(get(queue.isShuffling)).toEqual(false)
      expectStoredList(queue)
    })
  })
})
