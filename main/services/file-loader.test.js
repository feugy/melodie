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
const { hash } = require('../utils')

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
  })

  describe('chooseFolder', () => {
    it('loads files selected from dialog', async () => {
      const filePaths = [faker.system.fileName(), faker.system.fileName()]
      electron.dialog.showOpenDialog.mockResolvedValueOnce({ filePaths })
      expect(await engine.chooseFolders()).toEqual(filePaths)
    })
  })

  describe('crawl', () => {
    it('handles no selection', async () => {
      expect(await engine.crawl())
      expect(lists.add).not.toHaveBeenCalled()
      expect(covers.findFor).not.toHaveBeenCalled()
      expect(tag.read).not.toHaveBeenCalled()
    })

    it('handles empty selection', async () => {
      expect(await engine.crawl([]))
      expect(lists.add).not.toHaveBeenCalled()
      expect(covers.findFor).not.toHaveBeenCalled()
      expect(tag.read).not.toHaveBeenCalled()
    })

    it('enrich tracks with tags and cover', async () => {
      const { folder, files } = await makeFolder({ depth: 3, fileNb: 10 })

      const tracks = await engine.crawl([folder])
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

      const tracks = await engine.crawl([folder])
      expect(tracks).toHaveLength(files.length)
      expect(lists.add).toHaveBeenCalledTimes(6)
      expect(lists.remove).toHaveBeenCalledTimes(0)
      expect(covers.findFor).toHaveBeenCalledTimes(files.length)
      expect(tag.read).toHaveBeenCalledTimes(files.length)
    })

    it('handles multiple folders', async () => {
      const tree1 = await makeFolder({ depth: 3, fileNb: 15 })
      const tree2 = await makeFolder({ depth: 2, fileNb: 10 })

      const tracks = await engine.crawl([tree1.folder, tree2.folder])
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
    })
  })
})
