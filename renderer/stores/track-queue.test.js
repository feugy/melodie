'use strict'

import { tick } from 'svelte'
import { get } from 'svelte/store'
import faker from 'faker'
import * as queue from './track-queue'
import { mockIpcRenderer } from '../tests'

describe('track-queue store', () => {
  beforeEach(queue.clear)

  it('has initial state', () => {
    expect(get(queue.tracks)).toEqual([])
    expect(get(queue.current)).not.toBeDefined()
    expect(get(queue.index)).toEqual(0)
  })

  it('enqueues new tracks', async () => {
    const files = [
      { id: 1, path: faker.system.fileName() },
      { id: 2, path: faker.system.fileName() },
      { id: 3, path: faker.system.fileName() }
    ]
    queue.add(files.slice(0, 2))
    queue.playNext()
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
      { id: 1, path: faker.system.fileName() },
      { id: 2, path: faker.system.fileName() },
      { id: 3, path: faker.system.fileName() }
    ]
    queue.add(files.slice(0, 2))
    queue.playNext()
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
      { id: 1, path: faker.system.fileName() },
      { id: 2, path: faker.system.fileName() },
      { id: 3, path: faker.system.fileName() }
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
      { id: 1, path: faker.system.fileName() },
      { id: 2, path: faker.system.fileName() },
      { id: 3, path: faker.system.fileName() }
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

    it('does nothing on empty queue', async () => {
      queue.playNext()
      await tick()

      expect(get(queue.tracks)).toEqual([])
      expect(get(queue.current)).not.toBeDefined()
      expect(get(queue.index)).toEqual(0)
    })

    it('goes to next and cycle', async () => {
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() },
        { id: 3, path: faker.system.fileName() }
      ]
      queue.add(files)
      expect(get(queue.tracks)).toEqual(files)
      expect(get(queue.current)).toEqual(files[0])
      expect(get(queue.index)).toEqual(0)

      queue.playNext()
      await tick()
      expect(get(queue.current)).toEqual(files[1])
      expect(get(queue.index)).toEqual(1)

      queue.playNext()
      await tick()
      expect(get(queue.current)).toEqual(files[2])
      expect(get(queue.index)).toEqual(2)

      queue.playNext()
      await tick()
      expect(get(queue.current)).toEqual(files[0])
      expect(get(queue.index)).toEqual(0)

      queue.playNext()
      await tick()
      expect(get(queue.current)).toEqual(files[1])
      expect(get(queue.index)).toEqual(1)
    })

    it('supports duplicates', async () => {
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() }
      ]
      files.push(files[0], { id: 3, path: faker.system.fileName() })

      queue.add(files)
      expect(get(queue.tracks)).toEqual(files)
      expect(get(queue.current)).toEqual(files[0])
      expect(get(queue.index)).toEqual(0)

      queue.playNext()
      await tick()
      expect(get(queue.current)).toEqual(files[1])
      expect(get(queue.index)).toEqual(1)

      queue.playNext()
      await tick()
      expect(get(queue.current)).toEqual(files[0])
      expect(get(queue.index)).toEqual(2)

      queue.playNext()
      await tick()
      expect(get(queue.current)).toEqual(files[3])
      expect(get(queue.index)).toEqual(3)

      queue.playNext()
      await tick()
      expect(get(queue.current)).toEqual(files[0])
      expect(get(queue.index)).toEqual(0)
    })
  })

  describe('previous', () => {
    it('does nothing on empty queue', async () => {
      queue.playPrevious()
      await tick()

      expect(get(queue.tracks)).toEqual([])
      expect(get(queue.current)).not.toBeDefined()
      expect(get(queue.index)).toEqual(0)
    })

    it('goes to previous and cycle', async () => {
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() },
        { id: 3, path: faker.system.fileName() }
      ]
      queue.add(files)
      expect(get(queue.tracks)).toEqual(files)
      expect(get(queue.current)).toEqual(files[0])
      expect(get(queue.index)).toEqual(0)

      queue.playPrevious()
      await tick()
      expect(get(queue.current)).toEqual(files[2])
      expect(get(queue.index)).toEqual(2)

      queue.playPrevious()
      await tick()
      expect(get(queue.current)).toEqual(files[1])
      expect(get(queue.index)).toEqual(1)

      queue.playPrevious()
      await tick()
      expect(get(queue.current)).toEqual(files[0])
      expect(get(queue.index)).toEqual(0)

      queue.playPrevious()
      await tick()
      expect(get(queue.current)).toEqual(files[2])
      expect(get(queue.index)).toEqual(2)
    })
  })

  describe('jumpTo', () => {
    beforeEach(() => queue.clear())
    it('does nothing on empty queue', async () => {
      queue.jumpTo(1)
      await tick()

      expect(get(queue.tracks)).toEqual([])
      expect(get(queue.current)).not.toBeDefined()
      expect(get(queue.index)).toEqual(0)
    })

    it('goes forward and backward', async () => {
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() },
        { id: 3, path: faker.system.fileName() }
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
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() }
      ]

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
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() }
      ]
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

  describe('remove', () => {
    beforeEach(() => queue.clear())
    it('does nothing on empty queue', async () => {
      queue.remove(1)
      await tick()

      expect(get(queue.tracks)).toEqual([])
      expect(get(queue.index)).toEqual(0)
      expect(get(queue.current)).not.toBeDefined()
    })

    it('removes future track', async () => {
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() },
        { id: 3, path: faker.system.fileName() }
      ]
      queue.add(files)
      expect(get(queue.tracks)).toEqual(files)
      expect(get(queue.current)).toEqual(files[0])
      expect(get(queue.index)).toEqual(0)

      queue.remove(2)
      await tick()
      expect(get(queue.tracks)).toEqual(files.slice(0, 2))
      expect(get(queue.index)).toEqual(0)
      expect(get(queue.current)).toEqual(files[0])
    })

    it('removes current track', async () => {
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() },
        { id: 3, path: faker.system.fileName() }
      ]
      queue.add(files)
      queue.playNext()
      expect(get(queue.tracks)).toEqual(files)
      expect(get(queue.current)).toEqual(files[1])
      expect(get(queue.index)).toEqual(1)

      queue.remove(1)
      await tick()
      expect(get(queue.tracks)).toEqual([
        ...files.slice(0, 1),
        ...files.slice(2)
      ])
      expect(get(queue.index)).toEqual(1)
      expect(get(queue.current)).toEqual(files[2])
    })

    it('removes last current track', async () => {
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() },
        { id: 3, path: faker.system.fileName() }
      ]
      queue.add(files)
      queue.jumpTo(2)
      expect(get(queue.tracks)).toEqual(files)
      expect(get(queue.current)).toEqual(files[2])
      expect(get(queue.index)).toEqual(2)

      queue.remove(2)
      await tick()
      expect(get(queue.tracks)).toEqual([...files.slice(0, 2)])
      expect(get(queue.index)).toEqual(0)
      expect(get(queue.current)).toEqual(files[0])
    })

    it('removes past track', async () => {
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() },
        { id: 3, path: faker.system.fileName() }
      ]
      queue.add(files)
      queue.jumpTo(2)
      expect(get(queue.tracks)).toEqual(files)
      expect(get(queue.current)).toEqual(files[2])
      expect(get(queue.index)).toEqual(2)

      queue.remove(1)
      await tick()
      expect(get(queue.tracks)).toEqual([
        ...files.slice(0, 1),
        ...files.slice(2)
      ])
      expect(get(queue.index)).toEqual(1)
      expect(get(queue.current)).toEqual(files[2])
    })

    it('ignores out of bound index', async () => {
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() }
      ]

      queue.add(files)
      expect(get(queue.tracks)).toEqual(files)
      expect(get(queue.current)).toEqual(files[0])
      expect(get(queue.index)).toEqual(0)

      queue.remove(10)
      await tick()
      expect(get(queue.index)).toEqual(0)
      expect(get(queue.current)).toEqual(files[0])

      queue.remove(-1)
      await tick()
      expect(get(queue.index)).toEqual(0)
      expect(get(queue.current)).toEqual(files[0])
    })

    it('supports duplicates', async () => {
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() }
      ]
      files.push(files[0], { id: 3, path: faker.system.fileName() })

      queue.add(files)
      expect(get(queue.tracks)).toEqual(files)
      expect(get(queue.current)).toEqual(files[0])
      expect(get(queue.index)).toEqual(0)

      queue.remove(2)
      await tick()
      expect(get(queue.tracks)).toEqual([
        ...files.slice(0, 2),
        ...files.slice(3)
      ])
      expect(get(queue.index)).toEqual(0)
    })
  })

  describe('given incoming changes', () => {
    it('does not change empty queue', async () => {
      mockIpcRenderer.emit('track-change', null, {
        id: 1,
        path: faker.system.fileName()
      })
      await tick()

      expect(get(queue.tracks)).toEqual([])
      expect(get(queue.index)).toEqual(0)
      expect(get(queue.current)).not.toBeDefined()
    })

    it('does not change queue on un-queued track', async () => {
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() }
      ]
      queue.add(files)

      mockIpcRenderer.emit('track-change', null, {
        id: 3,
        path: faker.system.fileName()
      })
      await tick()

      expect(get(queue.tracks)).toEqual(files)
      expect(get(queue.index)).toEqual(0)
      expect(get(queue.current)).toEqual(files[0])
    })

    it('updates all occurences of changed track', async () => {
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() }
      ]
      files.push(files[0], { id: 3, path: faker.system.fileName() })
      queue.add(files)
      await tick()
      expect(get(queue.tracks)).toEqual(files)
      expect(get(queue.index)).toEqual(0)
      expect(get(queue.current)).toEqual(files[0])

      const changed = { id: 1, path: faker.system.fileName() }
      mockIpcRenderer.emit('track-change', null, changed)
      await tick()

      expect(get(queue.tracks)).toEqual([changed, files[1], changed, files[3]])
      expect(get(queue.index)).toEqual(0)
      expect(get(queue.current)).toEqual(changed)
    })
  })

  describe('given incoming removal', () => {
    it('does not change empty queue', async () => {
      mockIpcRenderer.emit('track-removal', null, 1)
      await tick()

      expect(get(queue.tracks)).toEqual([])
      expect(get(queue.index)).toEqual(0)
      expect(get(queue.current)).not.toBeDefined()
    })

    it('does not change queue on un-queued track', async () => {
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() }
      ]
      queue.add(files)

      mockIpcRenderer.emit('track-removal', null, 3)
      await tick()

      expect(get(queue.tracks)).toEqual(files)
      expect(get(queue.index)).toEqual(0)
      expect(get(queue.current)).toEqual(files[0])
    })

    it('removes single occurences of removed track', async () => {
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() },
        { id: 3, path: faker.system.fileName() }
      ]
      queue.add(files)
      queue.playNext()
      await tick()

      expect(get(queue.tracks)).toEqual(files)
      expect(get(queue.index)).toEqual(1)
      expect(get(queue.current)).toEqual(files[1])

      mockIpcRenderer.emit('track-removal', null, files[1].id)
      await tick()

      expect(get(queue.tracks)).toEqual([files[0], files[2]])
      expect(get(queue.index)).toEqual(1)
      expect(get(queue.current)).toEqual(files[2])
    })

    it('removes all occurences of removed track', async () => {
      const files = [
        { id: 1, path: faker.system.fileName() },
        { id: 2, path: faker.system.fileName() }
      ]
      files.push(files[1], { id: 3, path: faker.system.fileName() })
      queue.add(files)
      queue.playNext()
      await tick()

      expect(get(queue.tracks)).toEqual(files)
      expect(get(queue.index)).toEqual(1)
      expect(get(queue.current)).toEqual(files[1])

      mockIpcRenderer.emit('track-removal', null, files[1].id)
      await tick()

      expect(get(queue.tracks)).toEqual([files[0], files[3]])
      expect(get(queue.index)).toEqual(1)
      expect(get(queue.current)).toEqual(files[3])
    })
  })
})
