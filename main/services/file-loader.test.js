'use strict'

const faker = require('faker')
const { join } = require('path')
const fs = require('fs-extra')
const mockOs = require('os')
const electron = require('electron')
const engine = require('./file-loader')
const tag = require('./tag-reader')
const covers = require('./cover-finder')
const lists = require('./list-engine')
const { tracksModel } = require('../models/tracks')
const { settingsModel } = require('../models/settings')
const { hash, broadcast } = require('../utils')

const wait = n => new Promise(r => setTimeout(r, n))

jest.mock('electron', () => ({
  dialog: {
    showOpenDialog: jest.fn()
  },
  app: {
    getAppPath: jest.fn()
  }
}))
jest.mock('./list-engine')
jest.mock('./cover-finder')
jest.mock('./tag-reader')
jest.mock('../models/tracks')
jest.mock('../models/settings')
jest.mock('../utils/electron-remote')

async function makeFolder({
  folder = join(mockOs.tmpdir(), 'melodie-'),
  fileNb = faker.random.number({ min: 2, max: 10 }),
  depth = 1
} = {}) {
  const files = []
  folder = await fs.mkdtemp(folder)
  const directFilesNb =
    depth === 1 ? fileNb : faker.random.number({ min: 1, max: fileNb - depth })
  for (const n of Array.from({ length: directFilesNb }, (v, i) => i)) {
    const path = join(
      folder,
      `${depth}-${n}.${faker.random.arrayElement(['mp3', 'ogg', 'flac'])}`
    )
    await fs.createFile(path)
    files.push({ path, stats: await fs.stat(path) })
  }
  if (depth > 1) {
    files.push(
      ...(
        await makeFolder({
          folder: join(folder, 'folder-'),
          fileNb: fileNb - directFilesNb,
          depth: depth - 1
        })
      ).files
    )
  }
  return { files, folder }
}

describe('File loader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    electron.app.getAppPath.mockReturnValue(mockOs.tmpdir())
    covers.findFor.mockResolvedValue(null)
    tag.read.mockResolvedValue({})
    lists.add.mockImplementation(async n => n)
    lists.remove.mockImplementation(async n => n)
    settingsModel.get.mockResolvedValue({ folders: [] })
  })

  describe('addFolders', () => {
    it('saves selected folders to settings', async () => {
      const tree1 = await makeFolder({ depth: 1, fileNb: 0 })
      const tree2 = await makeFolder({ depth: 1, fileNb: 0 })
      const folders = [faker.system.fileName()]
      settingsModel.get.mockResolvedValueOnce({ folders })
      const filePaths = [tree1.folder, tree2.folder]
      electron.dialog.showOpenDialog.mockResolvedValueOnce({ filePaths })

      expect(await engine.addFolders())

      expect(settingsModel.get).toHaveBeenCalledWith()
      expect(settingsModel.get).toHaveBeenCalledTimes(1)
      expect(settingsModel.save).toHaveBeenCalledWith({
        id: settingsModel.ID,
        folders: folders.concat(filePaths)
      })
      expect(settingsModel.save).toHaveBeenCalledTimes(1)
      expect(broadcast).toHaveBeenNthCalledWith(1, 'tracking', {
        inProgress: true,
        op: 'addFolders'
      })
      expect(broadcast).toHaveBeenNthCalledWith(2, 'tracking', {
        inProgress: false,
        op: 'addFolders'
      })
    })

    it('does not saves empty selection', async () => {
      electron.dialog.showOpenDialog.mockResolvedValueOnce({ filePaths: [] })

      expect(await engine.addFolders())

      expect(settingsModel.getById).not.toHaveBeenCalled()
      expect(settingsModel.save).not.toHaveBeenCalled()
      expect(lists.add).not.toHaveBeenCalled()
      expect(covers.findFor).not.toHaveBeenCalled()
      expect(tag.read).not.toHaveBeenCalled()
      expect(broadcast).not.toHaveBeenCalled()
    })

    it('enrich tracks with tags and cover', async () => {
      const { folder, files } = await makeFolder({ depth: 3, fileNb: 10 })
      electron.dialog.showOpenDialog.mockResolvedValueOnce({
        filePaths: [folder]
      })

      const tracks = await engine.addFolders()
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
        saved =>
          new Promise(r =>
            setTimeout(r, faker.random.number({ min: 100, max: 200 }), saved)
          )
      )
      electron.dialog.showOpenDialog.mockResolvedValueOnce({
        filePaths: [folder]
      })

      const tracks = await engine.addFolders()
      expect(tracks).toHaveLength(files.length)
      expect(lists.add).toHaveBeenCalledTimes(6)
      expect(lists.remove).toHaveBeenCalledTimes(0)
      expect(covers.findFor).toHaveBeenCalledTimes(files.length)
      expect(tag.read).toHaveBeenCalledTimes(files.length)
    })

    it('handles multiple folders', async () => {
      const tree1 = await makeFolder({ depth: 3, fileNb: 15 })
      const tree2 = await makeFolder({ depth: 2, fileNb: 10 })
      electron.dialog.showOpenDialog.mockResolvedValueOnce({
        filePaths: [tree1.folder, tree2.folder]
      })

      const tracks = await engine.addFolders()
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
    let subscription

    beforeEach(async () => {
      tree = await makeFolder({ depth: 3, fileNb: 15 })
    })

    afterEach(() => {
      if (subscription) {
        subscription.unsubscribe()
        subscription = null
      }
    })

    it('finds new files and save them', async () => {
      subscription = engine.watch([tree.folder])

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
      subscription = engine.watch([tree.folder])

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

      subscription = engine.watch([tree.folder])

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
})
