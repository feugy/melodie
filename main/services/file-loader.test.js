'use strict'

const faker = require('faker')
const { join } = require('path')
const fs = require('fs-extra')
const engine = require('./file-loader')
const tag = require('./tag-reader')
const covers = require('./cover-finder')
const lists = require('./list-engine')
const { tracksModel } = require('../models/tracks')
const { hash, broadcast } = require('../utils')
const { makeFolder } = require('../tests')

const wait = n => new Promise(r => setTimeout(r, n))

jest.mock('./list-engine')
jest.mock('./cover-finder')
jest.mock('./tag-reader')
jest.mock('../models/tracks')
jest.mock('../utils/electron-remote')

describe('File loader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    covers.findFor.mockResolvedValue(null)
    tag.read.mockResolvedValue({})
    lists.add.mockResolvedValue()
    lists.remove.mockImplementation(async n => n)
  })

  afterEach(() => engine.releaseSubscriptions())

  describe('walkAndWatch', () => {
    it('enrich tracks with tags and cover', async () => {
      const { folder, files } = await makeFolder({ depth: 3, fileNb: 10 })

      const tracks = await engine.walkAndWatch([folder])
      expect(tracks).toEqual(
        expect.arrayContaining(
          files.map(({ path, stats }) => ({
            id: hash(path),
            path: path,
            media: null,
            tags: {},
            mtimeMs: stats.mtimeMs
          }))
        )
      )
      expect(tracks).toHaveLength(files.length)
      expect(lists.add).toHaveBeenCalledWith(tracks)
      expect(lists.add).toHaveBeenCalledTimes(1)
      expect(lists.remove).toHaveBeenCalledTimes(0)
      for (const { path } of files) {
        expect(covers.findFor).toHaveBeenCalledWith(path)
        expect(tag.read).toHaveBeenCalledWith(path)
      }
      expect(covers.findFor).toHaveBeenCalledTimes(files.length)
      expect(tag.read).toHaveBeenCalledTimes(files.length)
    })

    it('process tracks in batches', async () => {
      const { folder, files } = await makeFolder({ depth: 3, fileNb: 270 })
      lists.add.mockImplementation(
        () =>
          new Promise(r =>
            setTimeout(r, faker.random.number({ min: 100, max: 200 }))
          )
      )

      const tracks = await engine.walkAndWatch([folder])
      expect(tracks).toHaveLength(files.length)
      expect(lists.add).toHaveBeenCalledTimes(6)
      expect(lists.remove).toHaveBeenCalledTimes(0)
      expect(covers.findFor).toHaveBeenCalledTimes(files.length)
      expect(tag.read).toHaveBeenCalledTimes(files.length)
    })

    it('handles multiple folders', async () => {
      const tree1 = await makeFolder({ depth: 3, fileNb: 15 })
      const tree2 = await makeFolder({ depth: 2, fileNb: 10 })

      const tracks = await engine.walkAndWatch([tree1.folder, tree2.folder])
      expect(tracks).toEqual(
        expect.arrayContaining(
          tree1.files.map(({ path }) => expect.objectContaining({ path }))
        )
      )
      expect(tracks).toEqual(
        expect.arrayContaining(
          tree2.files.map(({ path }) => expect.objectContaining({ path }))
        )
      )
      expect(tracks).toHaveLength(tree1.files.length + tree2.files.length)
      expect(covers.findFor).toHaveBeenCalledTimes(tracks.length)
      expect(tag.read).toHaveBeenCalledTimes(tracks.length)
      expect(lists.add).toHaveBeenCalledTimes(1)
      expect(lists.remove).toHaveBeenCalledTimes(0)
    })
  })

  describe('compare', () => {
    let tree
    const existing = new Map()

    beforeEach(async () => {
      existing.clear()
      tree = await makeFolder({ depth: 3, fileNb: 15 })
      for (const file of tree.files) {
        existing.set(hash(file.path), file.stats.mtimeMs)
      }
      tracksModel.listWithTime.mockResolvedValueOnce(existing)
    })

    it('finds new files and save them', async () => {
      const newFiles = tree.files.slice(2, 6)
      for (const { path } of newFiles) {
        existing.delete(hash(path))
      }

      const { saved, removedIds } = await engine.compare([tree.folder])

      const tracks = newFiles.map(({ path, stats: { mtimeMs } }) => ({
        id: hash(path),
        path,
        media: null,
        tags: {},
        mtimeMs
      }))
      expect(removedIds).toEqual([])
      expect(saved).toEqual(tracks)
      expect(lists.add).toHaveBeenCalledWith(tracks)
      expect(lists.add).toHaveBeenCalledTimes(1)
      expect(lists.remove).toHaveBeenCalledTimes(0)
      for (const { path } of newFiles) {
        expect(covers.findFor).toHaveBeenCalledWith(path)
        expect(tag.read).toHaveBeenCalledWith(path)
      }
      expect(covers.findFor).toHaveBeenCalledTimes(newFiles.length)
      expect(tag.read).toHaveBeenCalledTimes(newFiles.length)
    })

    it('finds modified files and save them', async () => {
      const modified = tree.files.slice(4, 10)
      for (const { path } of modified) {
        existing.set(hash(path), Date.now() - 5e3)
      }

      const { saved, removedIds } = await engine.compare([tree.folder])

      const tracks = modified.map(({ path, stats: { mtimeMs } }) => ({
        id: hash(path),
        path,
        media: null,
        tags: {},
        mtimeMs
      }))
      expect(removedIds).toEqual([])
      expect(saved).toEqual(tracks)
      expect(lists.add).toHaveBeenCalledWith(tracks)
      expect(lists.add).toHaveBeenCalledTimes(1)
      expect(lists.remove).toHaveBeenCalledTimes(0)
      for (const { path } of modified) {
        expect(covers.findFor).toHaveBeenCalledWith(path)
        expect(tag.read).toHaveBeenCalledWith(path)
      }
      expect(covers.findFor).toHaveBeenCalledTimes(modified.length)
      expect(tag.read).toHaveBeenCalledTimes(modified.length)
    })

    it('finds missing files and removed them', async () => {
      const missing = [
        {
          path: join(tree.folder, `${faker.lorem.word()}.mp3`)
        },
        {
          path: join(tree.folder, `${faker.lorem.word()}.ogg`)
        },
        {
          path: join(tree.folder, `${faker.lorem.word()}.flac`)
        }
      ]
      for (const { path } of missing) {
        existing.set(hash(path), Date.now())
      }

      const { saved, removedIds } = await engine.compare([tree.folder])

      expect(removedIds).toEqual(missing.map(({ path }) => hash(path)))
      expect(saved).toEqual([])
      expect(lists.add).toHaveBeenCalledTimes(0)
      expect(lists.remove).toHaveBeenCalledWith(removedIds)
      expect(lists.remove).toHaveBeenCalledTimes(1)
      expect(covers.findFor).toHaveBeenCalledTimes(0)
      expect(tag.read).toHaveBeenCalledTimes(0)
    })

    it('handles not modifications', async () => {
      const { saved, removedIds } = await engine.compare([tree.folder])

      expect(removedIds).toEqual([])
      expect(saved).toEqual([])
      expect(lists.add).toHaveBeenCalledTimes(0)
      expect(lists.remove).toHaveBeenCalledTimes(0)
      expect(covers.findFor).toHaveBeenCalledTimes(0)
      expect(tag.read).toHaveBeenCalledTimes(0)
    })

    it('can handle all changes', async () => {
      const newFiles = tree.files.slice(2, 6)
      for (const { path } of newFiles) {
        existing.delete(hash(path))
      }
      const modified = tree.files.slice(8, 10)
      for (const { path } of modified) {
        existing.set(hash(path), Date.now() - 5e3)
      }
      const newAndModified = newFiles.concat(modified)
      const missing = [
        {
          path: join(tree.folder, `${faker.lorem.word()}.mp3`)
        },
        {
          path: join(tree.folder, `${faker.lorem.word()}.ogg`)
        }
      ]
      for (const { path } of missing) {
        existing.set(hash(path), Date.now())
      }

      const { saved, removedIds } = await engine.compare([tree.folder])

      const tracks = newAndModified.map(({ path, stats: { mtimeMs } }) => ({
        id: hash(path),
        path,
        media: null,
        tags: {},
        mtimeMs
      }))
      expect(removedIds).toEqual(missing.map(({ path }) => hash(path)))
      expect(saved).toEqual(tracks)
      expect(lists.add).toHaveBeenCalledWith(tracks)
      expect(lists.add).toHaveBeenCalledTimes(1)
      expect(lists.remove).toHaveBeenCalledWith(removedIds)
      expect(lists.remove).toHaveBeenCalledTimes(1)
      for (const { path } of newAndModified) {
        expect(covers.findFor).toHaveBeenCalledWith(path)
        expect(tag.read).toHaveBeenCalledWith(path)
      }
      expect(covers.findFor).toHaveBeenCalledTimes(newAndModified.length)
      expect(tag.read).toHaveBeenCalledTimes(newAndModified.length)
      expect(broadcast).toHaveBeenNthCalledWith(1, 'tracking', {
        inProgress: true,
        op: 'compare'
      })
      expect(broadcast).toHaveBeenNthCalledWith(2, 'tracking', {
        inProgress: false,
        op: 'compare'
      })
    })
  })

  describe('watch', () => {
    let tree

    beforeEach(async () => {
      tree = await makeFolder({ depth: 3, fileNb: 15 })
    })

    it('finds new files and save them', async () => {
      engine.watch([tree.folder])

      await wait(200)

      const first = join(tree.folder, 'first.mp3')
      const second = join(tree.folder, 'second.ogg')
      const third = join(tree.folder, 'third.flac')

      fs.writeFile(first, faker.lorem.word())
      fs.writeFile(join(tree.folder, 'ignored.png'), faker.lorem.word())
      fs.writeFile(second, faker.lorem.word())
      fs.writeFile(join(tree.folder, 'ignored.jpg'), faker.lorem.word())
      fs.writeFile(third, faker.lorem.word())

      await wait(500)

      const tracks = [first, second, third].map(path => ({
        id: hash(path),
        path,
        media: null,
        tags: {},
        mtimeMs: expect.any(Number)
      }))

      expect(lists.remove).toHaveBeenCalledTimes(0)
      for (const obj of tracks) {
        expect(lists.add).toHaveBeenCalledWith([obj])
        expect(covers.findFor).toHaveBeenCalledWith(obj.path)
        expect(tag.read).toHaveBeenCalledWith(obj.path)
      }
      expect(lists.add).toHaveBeenCalledTimes(tracks.length)
      expect(covers.findFor).toHaveBeenCalledTimes(tracks.length)
      expect(tag.read).toHaveBeenCalledTimes(tracks.length)
    })

    it('finds modified files and save them', async () => {
      engine.watch([tree.folder])

      await wait(200)

      fs.writeFile(join(tree.folder, 'unsupported.png'), faker.lorem.word())

      const modified = tree.files.slice(2, 6)
      for (const { path } of modified) {
        fs.writeFile(path, faker.lorem.word())
      }

      await wait(500)

      const tracks = modified.map(({ path }) => ({
        id: hash(path),
        path,
        media: null,
        tags: {},
        mtimeMs: expect.any(Number)
      }))

      expect(lists.remove).toHaveBeenCalledTimes(0)
      for (const obj of tracks) {
        expect(lists.add).toHaveBeenCalledWith([obj])
        expect(covers.findFor).toHaveBeenCalledWith(obj.path)
        expect(tag.read).toHaveBeenCalledWith(obj.path)
      }
      expect(lists.add).toHaveBeenCalledTimes(tracks.length)
      expect(covers.findFor).toHaveBeenCalledTimes(tracks.length)
      expect(tag.read).toHaveBeenCalledTimes(tracks.length)
    })

    it('finds delete files and removes them', async () => {
      const unsupported = join(tree.folder, 'unsupported.png')
      fs.writeFile(unsupported, faker.lorem.word())

      engine.watch([tree.folder])

      await wait(200)

      const removed = tree.files.slice(3, 7)
      for (const { path } of removed) {
        fs.unlink(path)
      }
      fs.unlink(unsupported)

      await wait(500)

      const tracks = removed.map(({ path }) => ({
        id: hash(path),
        path,
        media: null,
        tags: {},
        mtimeMs: expect.any(Number)
      }))

      for (const obj of tracks) {
        expect(lists.remove).toHaveBeenCalledWith([obj.id])
      }
      expect(lists.remove).toHaveBeenCalledTimes(tracks.length)
      expect(lists.add).toHaveBeenCalledTimes(0)
      expect(covers.findFor).toHaveBeenCalledTimes(0)
      expect(tag.read).toHaveBeenCalledTimes(0)
    })
  })

  describe('unwatch', () => {
    let trees

    beforeEach(async () => {
      trees = [
        await makeFolder({ depth: 3, fileNb: 15 }),
        await makeFolder({ depth: 2, fileNb: 5 })
      ]
      engine.watch(trees.map(tree => tree.folder))
    })

    it('stops watching tracked folder', async () => {
      engine.unwatch(trees[0].folder)
      await wait(200)

      fs.writeFile(join(trees[0].folder, 'first.mp3'), faker.lorem.word())

      await wait(500)
      expect(lists.remove).not.toHaveBeenCalled()
      expect(lists.add).not.toHaveBeenCalled()
    })

    it('stops watching multiple folders', async () => {
      engine.unwatch(trees.map(tree => tree.folder))
      await wait(200)

      fs.writeFile(join(trees[0].folder, 'first.mp3'), faker.lorem.word())
      fs.writeFile(join(trees[1].folder, 'second.mp3'), faker.lorem.word())

      await wait(500)
      expect(lists.remove).not.toHaveBeenCalled()
      expect(lists.add).not.toHaveBeenCalled()
    })

    it('ignores untracked folders', async () => {
      engine.unwatch(faker.system.fileName())

      await wait(200)

      fs.writeFile(join(trees[0].folder, 'first.mp3'), faker.lorem.word())

      await wait(500)
      expect(lists.add).toHaveBeenCalledTimes(1)
    })
  })
})
