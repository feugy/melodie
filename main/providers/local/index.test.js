'use strict'

const { join } = require('path')
const os = require('os')
const fs = require('fs-extra')
const faker = require('faker')
const provider = require('.')
const tag = require('./tag-reader')
const covers = require('./cover-finder')
const tracksService = require('../../services/tracks')
const { albumsModel, tracksModel, settingsModel } = require('../../models')
const { hash, broadcast } = require('../../utils')
const { makeFolder, sleep } = require('../../tests')

jest.mock('../../models/tracks')
jest.mock('../../models/albums')
jest.mock('../../models/settings')
jest.mock('../../services/tracks')
jest.mock('../../utils/electron-remote')
jest.mock('./cover-finder')
jest.mock('./tag-reader')

describe('Local provider', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    covers.findInFolder.mockResolvedValue(null)
    tag.read.mockResolvedValue({})
    tracksService.add.mockResolvedValue()
    tracksService.remove.mockImplementation(async n => n)
  })

  afterEach(() => provider.unwatchAll())

  describe('findAlbumCover()', () => {
    const folder = join(os.tmpdir(), 'melodie', faker.random.uuid())
    const folder2 = join(os.tmpdir(), 'melodie', faker.random.uuid())

    it('returns images from multiple folders', async () => {
      const searched = faker.random.word()
      const albums = [{ id: hash(folder) }, { id: hash(folder2) }]
      const results = [
        join(
          folder,
          'AlbumArt_{62D46EC5-701B-40A3-B7A7-D66E1E29EECA}_Large.jpg'
        ),
        join(folder, 'Folder.png'),
        join(folder, 'cover.jpeg'),
        join(folder2, 'Folder.png'),
        join(folder2, 'cover.jpeg')
      ].map(full => ({ full, provider: provider.name }))

      albumsModel.getByName.mockResolvedValueOnce(albums)
      covers.findForAlbum.mockResolvedValueOnce(results.slice(0, 3))
      covers.findForAlbum.mockResolvedValueOnce(results.slice(3))

      expect(await provider.findAlbumCover(searched)).toEqual(results)
      expect(albumsModel.getByName).toHaveBeenCalledWith(searched)
      expect(covers.findForAlbum).toHaveBeenCalledWith(albums[0], 0, albums)
      expect(covers.findForAlbum).toHaveBeenCalledWith(albums[1], 1, albums)
      expect(covers.findForAlbum).toHaveBeenCalledTimes(2)
    })

    it('returns nothing on unknown folder', async () => {
      const searched = faker.random.word()
      albumsModel.getByName.mockResolvedValueOnce([])

      expect(await provider.findAlbumCover(searched)).toEqual([])
      expect(albumsModel.getByName).toHaveBeenCalledWith(searched)
      expect(covers.findForAlbum).not.toHaveBeenCalled()
    })

    it('returns nothing on failure', async () => {
      const searched = faker.random.word()
      albumsModel.getByName.mockRejectedValue(new Error('fake error'))

      expect(await provider.findAlbumCover(searched)).toEqual([])
      expect(albumsModel.getByName).toHaveBeenCalledWith(searched)
      expect(covers.findForAlbum).not.toHaveBeenCalled()
    })
  })

  describe('importTracks', () => {
    it('enrich tracks with tags and cover', async () => {
      const { folder, files } = await makeFolder({ depth: 3, fileNb: 10 })
      settingsModel.get.mockResolvedValueOnce({ folders: [folder] })

      const tracks = await provider.importTracks()
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
      expect(tracksService.add).toHaveBeenCalledWith(tracks)
      expect(tracksService.add).toHaveBeenCalledTimes(1)
      expect(tracksService.remove).toHaveBeenCalledTimes(0)
      for (const { path } of files) {
        expect(covers.findInFolder).toHaveBeenCalledWith(path)
        expect(tag.read).toHaveBeenCalledWith(path)
      }
      expect(covers.findInFolder).toHaveBeenCalledTimes(files.length)
      expect(tag.read).toHaveBeenCalledTimes(files.length)
    })

    it('process tracks in batches', async () => {
      const { folder, files } = await makeFolder({ depth: 3, fileNb: 270 })
      tracksService.add.mockImplementation(
        () =>
          new Promise(r =>
            setTimeout(r, faker.random.number({ min: 100, max: 200 }))
          )
      )
      settingsModel.get.mockResolvedValueOnce({ folders: [folder] })

      const tracks = await provider.importTracks()
      expect(tracks).toHaveLength(files.length)
      expect(tracksService.add).toHaveBeenCalledTimes(6)
      expect(tracksService.remove).toHaveBeenCalledTimes(0)
      expect(covers.findInFolder).toHaveBeenCalledTimes(files.length)
      expect(tag.read).toHaveBeenCalledTimes(files.length)
    })

    it('handles multiple folders', async () => {
      const tree1 = await makeFolder({ depth: 3, fileNb: 15 })
      const tree2 = await makeFolder({ depth: 2, fileNb: 10 })
      settingsModel.get.mockResolvedValueOnce({
        folders: [tree1.folder, tree2.folder]
      })

      const tracks = await provider.importTracks()
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
      expect(covers.findInFolder).toHaveBeenCalledTimes(tracks.length)
      expect(tag.read).toHaveBeenCalledTimes(tracks.length)
      expect(tracksService.add).toHaveBeenCalledTimes(1)
      expect(tracksService.remove).toHaveBeenCalledTimes(0)
    })
  })

  describe('compareTracks', () => {
    let tree
    const existing = new Map()

    beforeEach(async () => {
      existing.clear()
      tree = await makeFolder({ depth: 3, fileNb: 15 })
      for (const file of tree.files) {
        existing.set(hash(file.path), file.stats.mtimeMs)
      }
      tracksModel.listWithTime.mockResolvedValueOnce(existing)
      settingsModel.get.mockResolvedValueOnce({ folders: [tree.folder] })
    })

    it('finds new files and save them', async () => {
      const newFiles = tree.files.slice(2, 6)
      for (const { path } of newFiles) {
        existing.delete(hash(path))
      }

      const { saved, removedIds } = await provider.compareTracks()

      const tracks = newFiles.map(({ path, stats: { mtimeMs } }) => ({
        id: hash(path),
        path,
        media: null,
        tags: {},
        mtimeMs
      }))
      expect(removedIds).toEqual([])
      expect(saved).toEqual(tracks)
      expect(tracksService.add).toHaveBeenCalledWith(tracks)
      expect(tracksService.add).toHaveBeenCalledTimes(1)
      expect(tracksService.remove).toHaveBeenCalledTimes(0)
      for (const { path } of newFiles) {
        expect(covers.findInFolder).toHaveBeenCalledWith(path)
        expect(tag.read).toHaveBeenCalledWith(path)
      }
      expect(covers.findInFolder).toHaveBeenCalledTimes(newFiles.length)
      expect(tag.read).toHaveBeenCalledTimes(newFiles.length)
    })

    it('finds modified files and save them', async () => {
      const modified = tree.files.slice(4, 10)
      for (const { path } of modified) {
        existing.set(hash(path), Date.now() - 5e3)
      }

      const { saved, removedIds } = await provider.compareTracks()

      const tracks = modified.map(({ path, stats: { mtimeMs } }) => ({
        id: hash(path),
        path,
        media: null,
        tags: {},
        mtimeMs
      }))
      expect(removedIds).toEqual([])
      expect(saved).toEqual(tracks)
      expect(tracksService.add).toHaveBeenCalledWith(tracks)
      expect(tracksService.add).toHaveBeenCalledTimes(1)
      expect(tracksService.remove).toHaveBeenCalledTimes(0)
      for (const { path } of modified) {
        expect(covers.findInFolder).toHaveBeenCalledWith(path)
        expect(tag.read).toHaveBeenCalledWith(path)
      }
      expect(covers.findInFolder).toHaveBeenCalledTimes(modified.length)
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

      const { saved, removedIds } = await provider.compareTracks()

      expect(removedIds).toEqual(missing.map(({ path }) => hash(path)))
      expect(saved).toEqual([])
      expect(tracksService.add).toHaveBeenCalledTimes(0)
      expect(tracksService.remove).toHaveBeenCalledWith(removedIds)
      expect(tracksService.remove).toHaveBeenCalledTimes(1)
      expect(covers.findInFolder).toHaveBeenCalledTimes(0)
      expect(tag.read).toHaveBeenCalledTimes(0)
    })

    it('handles no modifications', async () => {
      const { saved, removedIds } = await provider.compareTracks()

      expect(removedIds).toEqual([])
      expect(saved).toEqual([])
      expect(tracksService.add).toHaveBeenCalledTimes(0)
      expect(tracksService.remove).toHaveBeenCalledTimes(0)
      expect(covers.findInFolder).toHaveBeenCalledTimes(0)
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

      const { saved, removedIds } = await provider.compareTracks()

      const tracks = newAndModified.map(({ path, stats: { mtimeMs } }) => ({
        id: hash(path),
        path,
        media: null,
        tags: {},
        mtimeMs
      }))
      expect(removedIds).toEqual(missing.map(({ path }) => hash(path)))
      expect(saved).toEqual(tracks)
      expect(tracksService.add).toHaveBeenCalledWith(tracks)
      expect(tracksService.add).toHaveBeenCalledTimes(1)
      expect(tracksService.remove).toHaveBeenCalledWith(removedIds)
      expect(tracksService.remove).toHaveBeenCalledTimes(1)
      for (const { path } of newAndModified) {
        expect(covers.findInFolder).toHaveBeenCalledWith(path)
        expect(tag.read).toHaveBeenCalledWith(path)
      }
      expect(covers.findInFolder).toHaveBeenCalledTimes(newAndModified.length)
      expect(tag.read).toHaveBeenCalledTimes(newAndModified.length)
      expect(broadcast).toHaveBeenNthCalledWith(1, 'tracking', {
        inProgress: true,
        op: 'compareTracks',
        provider: 'Local'
      })
      expect(broadcast).toHaveBeenNthCalledWith(2, 'tracking', {
        inProgress: false,
        op: 'compareTracks',
        provider: 'Local'
      })
    })

    it('finds new files and save them', async () => {
      await provider.compareTracks()
      jest.clearAllMocks()

      await sleep(200)

      const first = join(tree.folder, 'first.mp3')
      const second = join(tree.folder, 'second.ogg')
      const third = join(tree.folder, 'third.flac')

      fs.writeFile(first, faker.lorem.word())
      fs.writeFile(join(tree.folder, 'ignored.png'), faker.lorem.word())
      fs.writeFile(second, faker.lorem.word())
      fs.writeFile(join(tree.folder, 'ignored.jpg'), faker.lorem.word())
      fs.writeFile(third, faker.lorem.word())

      await sleep(500)

      const tracks = [first, second, third].map(path => ({
        id: hash(path),
        path,
        media: null,
        tags: {},
        mtimeMs: expect.any(Number)
      }))

      expect(tracksService.remove).toHaveBeenCalledTimes(0)
      for (const obj of tracks) {
        expect(tracksService.add).toHaveBeenCalledWith([obj])
        expect(covers.findInFolder).toHaveBeenCalledWith(obj.path)
        expect(tag.read).toHaveBeenCalledWith(obj.path)
      }
      expect(tracksService.add).toHaveBeenCalledTimes(tracks.length)
      expect(covers.findInFolder).toHaveBeenCalledTimes(tracks.length)
      expect(tag.read).toHaveBeenCalledTimes(tracks.length)
    })

    it('finds modified files and save them', async () => {
      await provider.compareTracks()
      jest.clearAllMocks()

      await sleep(200)

      fs.writeFile(join(tree.folder, 'unsupported.png'), faker.lorem.word())

      const modified = tree.files.slice(2, 6)
      for (const { path } of modified) {
        fs.writeFile(path, faker.lorem.word())
      }

      await sleep(500)

      const tracks = modified.map(({ path }) => ({
        id: hash(path),
        path,
        media: null,
        tags: {},
        mtimeMs: expect.any(Number)
      }))

      expect(tracksService.remove).toHaveBeenCalledTimes(0)
      for (const obj of tracks) {
        expect(tracksService.add).toHaveBeenCalledWith([obj])
        expect(covers.findInFolder).toHaveBeenCalledWith(obj.path)
        expect(tag.read).toHaveBeenCalledWith(obj.path)
      }
      expect(tracksService.add).toHaveBeenCalledTimes(tracks.length)
      expect(covers.findInFolder).toHaveBeenCalledTimes(tracks.length)
      expect(tag.read).toHaveBeenCalledTimes(tracks.length)
    })

    it('finds delete files and removes them', async () => {
      const unsupported = join(tree.folder, 'unsupported.png')
      fs.writeFile(unsupported, faker.lorem.word())

      await provider.compareTracks()
      jest.clearAllMocks()

      await sleep(200)

      const removed = tree.files.slice(3, 7)
      for (const { path } of removed) {
        fs.unlink(path)
      }
      fs.unlink(unsupported)

      await sleep(500)

      const tracks = removed.map(({ path }) => ({
        id: hash(path),
        path,
        media: null,
        tags: {},
        mtimeMs: expect.any(Number)
      }))

      for (const obj of tracks) {
        expect(tracksService.remove).toHaveBeenCalledWith([obj.id])
      }
      expect(tracksService.remove).toHaveBeenCalledTimes(tracks.length)
      expect(tracksService.add).toHaveBeenCalledTimes(0)
      expect(covers.findInFolder).toHaveBeenCalledTimes(0)
      expect(tag.read).toHaveBeenCalledTimes(0)
    })

    it('stops watching previous folder', async () => {
      await provider.compareTracks()
      jest.clearAllMocks()

      tracksModel.listWithTime.mockResolvedValueOnce(new Map())
      settingsModel.get.mockResolvedValueOnce({ folders: [] })

      await provider.compareTracks()
      await sleep(200)

      fs.writeFile(join(tree.folder, 'first.mp3'), faker.lorem.word())

      await sleep(500)
      expect(tracksService.remove).not.toHaveBeenCalled()
      expect(tracksService.add).not.toHaveBeenCalled()
    })
  })
})
