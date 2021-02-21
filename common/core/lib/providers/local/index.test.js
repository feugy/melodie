'use strict'

const { basename, dirname, extname, join, resolve } = require('path')
const os = require('os')
const fs = require('fs-extra')
const faker = require('faker')
const provider = require('.')
const tagReader = require('./tag-reader')
const playlistUtils = require('./playlist')
const covers = require('./cover-finder')
const tracksService = require('../../services/tracks')
const playlistsService = require('../../services/playlists')
const { albumsModel, tracksModel, settingsModel } = require('../../models')
const { hash, broadcast } = require('../../utils')
const { makeFolder, makePlaylists, sleep } = require('../../tests')

jest.mock('../../models/tracks')
jest.mock('../../models/albums')
jest.mock('../../models/settings')
jest.mock('../../services/tracks')
jest.mock('../../services/playlists')
jest.mock('../../utils/connection')
jest.mock('./cover-finder')
jest.mock('./tag-reader', () => ({
  formats: ['.mp3', '.ogg', '.flac'],
  read: jest.fn()
}))
jest.mock('./playlist', () => {
  const { extname } = require('path')
  const formats = ['.m3u', '.m3u8']
  return {
    formats,
    isPlaylistFile(file) {
      return formats.includes(extname(file))
    },
    read: jest.fn()
  }
})

describe('Local provider', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    covers.findInFolder.mockResolvedValue(null)
    tagReader.read.mockResolvedValue({})
    tracksService.add.mockResolvedValue()
    tracksService.remove.mockImplementation(async n => n)
    playlistsService.save.mockImplementation(async n => n)
    playlistUtils.read.mockImplementation(async path => ({
      id: hash(path),
      name: basename(path).replace(extname(path), ''),
      trackIds: []
    }))
  })

  afterEach(() => provider.unwatchAll())

  describe('findArtistArtwork()', () => {
    const artworkFolder = process.env.ARTWORK_DESTINATION

    beforeEach(async () => {
      jest.resetAllMocks()
      await fs.ensureDir(artworkFolder)
    })

    afterEach(async () => {
      try {
        await fs.remove(artworkFolder)
      } catch (err) {
        // ignore missing files
      }
    })

    it('returns existing images for known artist', async () => {
      const searched = faker.random.word()
      const id = hash(searched)
      const files = [
        join(artworkFolder, `${id}.jpg`),
        join(artworkFolder, `${id}.png`)
      ]
      for (const file of files) {
        await fs.ensureFile(file)
      }

      expect(await provider.findArtistArtwork(searched)).toEqual([
        {
          artwork: files[1],
          provider: provider.name
        },
        {
          artwork: files[0],
          provider: provider.name
        }
      ])
    })

    it('returns nothing on unknown artist', async () => {
      const searched = faker.random.word()

      expect(await provider.findArtistArtwork(searched)).toEqual([])
    })
  })

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
      ].map(cover => ({ cover, provider: provider.name }))

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
            mtimeMs: stats.mtimeMs,
            ino: stats.ino
          }))
        )
      )
      expect(tracks).toHaveLength(files.length)
      expect(tracksService.add).toHaveBeenCalledWith(tracks)
      expect(tracksService.add).toHaveBeenCalledTimes(1)
      expect(tracksService.remove).not.toHaveBeenCalled()
      for (const { path } of files) {
        expect(covers.findInFolder).toHaveBeenCalledWith(path)
        expect(tagReader.read).toHaveBeenCalledWith(path)
      }
      expect(covers.findInFolder).toHaveBeenCalledTimes(files.length)
      expect(tagReader.read).toHaveBeenCalledTimes(files.length)
      expect(settingsModel.get).toHaveBeenCalledTimes(1)
      expect(playlistsService.checkIntegrity).toHaveBeenCalledTimes(1)
    })

    it('saves cover from track tags as album media', async () => {
      const { folder, files } = await makeFolder({ depth: 1, fileNb: 4 })
      settingsModel.get.mockResolvedValueOnce({ folders: [folder] })
      tagReader.read.mockResolvedValue({
        cover: {
          format: 'image/jpeg',
          data: await fs.readFile(
            resolve(__dirname, '..', '..', '..', '..', 'fixtures', 'cover.jpg')
          )
        }
      })
      const media = resolve(folder, 'cover.jpeg')

      const tracks = await provider.importTracks()
      expect(tracks).toEqual(
        expect.arrayContaining(
          files.map(({ path, stats }) => ({
            id: hash(path),
            path: path,
            media,
            tags: {},
            mtimeMs: stats.mtimeMs,
            ino: stats.ino
          }))
        )
      )
      expect(tracks).toHaveLength(files.length)
      expect(tracksService.add).toHaveBeenCalledWith(tracks)
      expect(tracksService.add).toHaveBeenCalledTimes(1)
      expect(tracksService.remove).not.toHaveBeenCalled()
      for (const { path } of files) {
        expect(covers.findInFolder).toHaveBeenCalledWith(path)
        expect(tagReader.read).toHaveBeenCalledWith(path)
      }
      expect(covers.findInFolder).toHaveBeenCalledTimes(files.length)
      expect(tagReader.read).toHaveBeenCalledTimes(files.length)
      expect(settingsModel.get).toHaveBeenCalledTimes(1)
      expect(playlistsService.checkIntegrity).toHaveBeenCalledTimes(1)
      await expect(fs.access(media, fs.constants.R_OK)).resolves.toBeNil()
    })

    it('handles error when saving cover from track tags as album media', async () => {
      const { folder, files } = await makeFolder({ depth: 1, fileNb: 4 })
      settingsModel.get.mockResolvedValueOnce({ folders: [folder] })
      tagReader.read.mockResolvedValue({
        cover: {
          format: 'image/png'
          // the lack of data should break fs.writeFile()
        }
      })

      const tracks = await provider.importTracks()
      expect(tracks).toEqual(
        expect.arrayContaining(
          files.map(({ path, stats }) => ({
            id: hash(path),
            path: path,
            media: null,
            tags: {},
            mtimeMs: stats.mtimeMs,
            ino: stats.ino
          }))
        )
      )
      expect(tracks).toHaveLength(files.length)
      expect(tracksService.add).toHaveBeenCalledWith(tracks)
      expect(tracksService.add).toHaveBeenCalledTimes(1)
      expect(tracksService.remove).not.toHaveBeenCalled()
      for (const { path } of files) {
        expect(covers.findInFolder).toHaveBeenCalledWith(path)
        expect(tagReader.read).toHaveBeenCalledWith(path)
      }
      expect(covers.findInFolder).toHaveBeenCalledTimes(files.length)
      expect(tagReader.read).toHaveBeenCalledTimes(files.length)
      expect(settingsModel.get).toHaveBeenCalledTimes(1)
      expect(playlistsService.checkIntegrity).toHaveBeenCalledTimes(1)
      await expect(
        fs.access(resolve(folder, 'cover.png'), fs.constants.R_OK)
      ).rejects.toThrow('ENOENT')
    })

    it('reads playlists', async () => {
      const { folder, files } = await makeFolder({ depth: 3, fileNb: 10 })
      const { playlists } = await makePlaylists({ files, playlistNb: 3 })

      settingsModel.get.mockResolvedValueOnce({ folders: [folder] })

      const trackModels = []
      const playlistModels = []
      for (const track of await provider.importTracks()) {
        ;(track.tags ? trackModels : playlistModels).push(track)
      }
      expect(trackModels).toEqual(
        expect.arrayContaining(
          files.map(({ path, stats }) => ({
            id: hash(path),
            path: path,
            media: null,
            tags: {},
            mtimeMs: stats.mtimeMs,
            ino: stats.ino
          }))
        )
      )
      expect(trackModels).toHaveLength(files.length)
      expect(playlistModels).toEqual(
        expect.arrayContaining(
          playlists.map(path => ({
            id: hash(path),
            name: basename(path).replace(extname(path), ''),
            trackIds: []
          }))
        )
      )
      expect(playlistModels).toHaveLength(playlists.length)

      expect(tracksService.add).toHaveBeenCalledWith(trackModels)
      expect(tracksService.add).toHaveBeenCalledTimes(1)
      expect(tracksService.remove).not.toHaveBeenCalled()
      for (const { path } of files) {
        expect(covers.findInFolder).toHaveBeenCalledWith(path)
        expect(tagReader.read).toHaveBeenCalledWith(path)
      }
      expect(covers.findInFolder).toHaveBeenCalledTimes(files.length)
      expect(tagReader.read).toHaveBeenCalledTimes(files.length)

      for (const model of playlistModels) {
        expect(playlistsService.save).toHaveBeenCalledWith(model, true)
      }
      expect(playlistsService.save).toHaveBeenCalledTimes(playlistModels.length)
      for (const path of playlists) {
        expect(playlistUtils.read).toHaveBeenCalledWith(path)
      }
      expect(playlistUtils.read).toHaveBeenCalledTimes(playlists.length)

      expect(settingsModel.get).toHaveBeenCalledTimes(1)
      expect(playlistsService.checkIntegrity).toHaveBeenCalledTimes(1)
    })

    it('ignores unparseable playlists', async () => {
      const { folder, files } = await makeFolder({ depth: 3, fileNb: 10 })
      const { playlists } = await makePlaylists({ files, playlistNb: 4 })
      // first 2 playlists are not readable
      playlistUtils.read.mockImplementation(async path =>
        +basename(path)[0] < 2
          ? null
          : {
              id: hash(path),
              name: basename(path).replace(extname(path), ''),
              trackIds: []
            }
      )

      settingsModel.get.mockResolvedValueOnce({ folders: [folder] })

      const trackModels = []
      const playlistModels = []
      for (const track of await provider.importTracks()) {
        ;(track.tags ? trackModels : playlistModels).push(track)
      }
      expect(trackModels).toEqual(
        expect.arrayContaining(
          files.map(({ path, stats }) => ({
            id: hash(path),
            path: path,
            media: null,
            tags: {},
            mtimeMs: stats.mtimeMs,
            ino: stats.ino
          }))
        )
      )
      expect(trackModels).toHaveLength(files.length)
      expect(playlistModels).toEqual(
        expect.arrayContaining(
          playlists.slice(2).map(path => ({
            id: hash(path),
            name: basename(path).replace(extname(path), ''),
            trackIds: []
          }))
        )
      )
      expect(playlistModels).toHaveLength(2)

      expect(tracksService.add).toHaveBeenCalledWith(trackModels)
      expect(tracksService.add).toHaveBeenCalledTimes(1)
      expect(tracksService.remove).not.toHaveBeenCalled()
      for (const { path } of files) {
        expect(covers.findInFolder).toHaveBeenCalledWith(path)
        expect(tagReader.read).toHaveBeenCalledWith(path)
      }
      expect(covers.findInFolder).toHaveBeenCalledTimes(files.length)
      expect(tagReader.read).toHaveBeenCalledTimes(files.length)

      for (const model of playlistModels) {
        expect(playlistsService.save).toHaveBeenCalledWith(model, true)
      }
      expect(playlistsService.save).toHaveBeenCalledTimes(playlistModels.length)
      for (const path of playlists) {
        expect(playlistUtils.read).toHaveBeenCalledWith(path)
      }
      expect(playlistUtils.read).toHaveBeenCalledTimes(playlists.length)

      expect(settingsModel.get).toHaveBeenCalledTimes(1)
      expect(playlistsService.checkIntegrity).toHaveBeenCalledTimes(1)
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
      expect(tracksService.remove).not.toHaveBeenCalled()
      expect(covers.findInFolder).toHaveBeenCalledTimes(files.length)
      expect(tagReader.read).toHaveBeenCalledTimes(files.length)
      expect(settingsModel.get).toHaveBeenCalledTimes(1)
      expect(playlistsService.checkIntegrity).toHaveBeenCalledTimes(1)
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
      expect(tagReader.read).toHaveBeenCalledTimes(tracks.length)
      expect(tracksService.add).toHaveBeenCalledTimes(1)
      expect(tracksService.remove).not.toHaveBeenCalled()
      expect(settingsModel.get).toHaveBeenCalledTimes(1)
      expect(playlistsService.checkIntegrity).toHaveBeenCalledTimes(1)
    })

    it('imports specified folders', async () => {
      const { folder, files } = await makeFolder({ depth: 3, fileNb: 10 })
      settingsModel.get.mockResolvedValueOnce({ folders: [folder] })

      const tracks = await provider.importTracks([folder])
      expect(tracks).toEqual(
        expect.arrayContaining(
          files.map(({ path, stats }) => ({
            id: hash(path),
            path: path,
            media: null,
            tags: {},
            mtimeMs: stats.mtimeMs,
            ino: stats.ino
          }))
        )
      )
      expect(tracks).toHaveLength(files.length)
      expect(tracksService.add).toHaveBeenCalledWith(tracks)
      expect(tracksService.add).toHaveBeenCalledTimes(1)
      expect(tracksService.remove).not.toHaveBeenCalled()
      for (const { path } of files) {
        expect(covers.findInFolder).toHaveBeenCalledWith(path)
        expect(tagReader.read).toHaveBeenCalledWith(path)
      }
      expect(covers.findInFolder).toHaveBeenCalledTimes(files.length)
      expect(tagReader.read).toHaveBeenCalledTimes(files.length)
      expect(settingsModel.get).toHaveBeenCalledTimes(1)
      expect(playlistsService.checkIntegrity).toHaveBeenCalledTimes(1)
    })
  })

  describe('compareTracks', () => {
    let tree
    let playlists
    const existing = new Map()

    beforeEach(async () => {
      existing.clear()
      tree = await makeFolder({ depth: 3, fileNb: 15 })
      playlists = (await makePlaylists({ ...tree, playlistNb: 4 })).playlists
      for (const file of tree.files) {
        existing.set(hash(file.path), file.stats.mtimeMs)
      }
      tracksModel.listWithTime.mockResolvedValueOnce(existing)
      settingsModel.get.mockResolvedValueOnce({ folders: [tree.folder] })
    })

    describe('given modifications before watching', () => {
      it('finds new files and save them', async () => {
        const newFiles = tree.files.slice(2, 6)
        for (const { path } of newFiles) {
          existing.delete(hash(path))
        }

        const { saved, removedIds } = await provider.compareTracks()

        const tracks = newFiles.map(({ path, stats: { mtimeMs, ino } }) => ({
          id: hash(path),
          path,
          media: null,
          tags: {},
          mtimeMs,
          ino
        }))
        expect(removedIds).toEqual([])
        expect(saved).toEqual(tracks)
        expect(tracksService.add).toHaveBeenCalledWith(tracks)
        expect(tracksService.add).toHaveBeenCalledTimes(1)
        expect(tracksService.remove).not.toHaveBeenCalled()
        expect(playlistsService.save).not.toHaveBeenCalled()
        for (const { path } of newFiles) {
          expect(covers.findInFolder).toHaveBeenCalledWith(path)
          expect(tagReader.read).toHaveBeenCalledWith(path)
        }
        expect(covers.findInFolder).toHaveBeenCalledTimes(newFiles.length)
        expect(tagReader.read).toHaveBeenCalledTimes(newFiles.length)
        expect(playlistUtils.read).not.toHaveBeenCalled()
        expect(playlistsService.checkIntegrity).toHaveBeenCalledTimes(1)
      })

      it('finds modified files and save them', async () => {
        const modified = tree.files.slice(4, 10)
        for (const { path } of modified) {
          existing.set(hash(path), Date.now() - 5e3)
        }

        const { saved, removedIds } = await provider.compareTracks()

        const tracks = modified.map(({ path, stats: { mtimeMs, ino } }) => ({
          id: hash(path),
          path,
          media: null,
          tags: {},
          mtimeMs,
          ino
        }))
        expect(removedIds).toEqual([])
        expect(saved).toEqual(tracks)
        expect(tracksService.add).toHaveBeenCalledWith(tracks)
        expect(tracksService.add).toHaveBeenCalledTimes(1)
        expect(tracksService.remove).not.toHaveBeenCalled()
        expect(playlistsService.save).not.toHaveBeenCalled()
        for (const { path } of modified) {
          expect(covers.findInFolder).toHaveBeenCalledWith(path)
          expect(tagReader.read).toHaveBeenCalledWith(path)
        }
        expect(covers.findInFolder).toHaveBeenCalledTimes(modified.length)
        expect(tagReader.read).toHaveBeenCalledTimes(modified.length)
        expect(playlistUtils.read).not.toHaveBeenCalled()
        expect(playlistsService.checkIntegrity).toHaveBeenCalledTimes(1)
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
        expect(tracksService.add).not.toHaveBeenCalled()
        expect(tracksService.remove).toHaveBeenCalledWith(removedIds)
        expect(tracksService.remove).toHaveBeenCalledTimes(1)
        expect(playlistsService.save).not.toHaveBeenCalled()
        expect(covers.findInFolder).not.toHaveBeenCalled()
        expect(tagReader.read).not.toHaveBeenCalled()
        expect(playlistUtils.read).not.toHaveBeenCalled()
        expect(playlistsService.checkIntegrity).not.toHaveBeenCalled()
      })

      it('ignores modifications, deletions and additiong of playlist files', async () => {
        await fs.unlink(playlists[0])
        await fs.writeFile(playlists[1], '#EXTM3U\ntest.mp3', 'latin1')
        await fs.writeFile(
          join(dirname(playlists[1]), 'new.m3u'),
          '#EXTM3U\ntest.mp3',
          'latin1'
        )

        const { saved, removedIds } = await provider.compareTracks()

        expect(removedIds).toEqual([])
        expect(saved).toEqual([])
        expect(tracksService.add).not.toHaveBeenCalled()
        expect(tracksService.remove).not.toHaveBeenCalled()
        expect(playlistsService.save).not.toHaveBeenCalled()
        expect(covers.findInFolder).not.toHaveBeenCalled()
        expect(tagReader.read).not.toHaveBeenCalled()
        expect(playlistUtils.read).not.toHaveBeenCalled()
        expect(playlistsService.checkIntegrity).not.toHaveBeenCalled()
      })
    })

    describe('given watching in progress', () => {
      it('handles no modifications', async () => {
        const { saved, removedIds } = await provider.compareTracks()

        expect(removedIds).toEqual([])
        expect(saved).toEqual([])
        expect(tracksService.add).not.toHaveBeenCalled()
        expect(tracksService.remove).not.toHaveBeenCalled()
        expect(playlistsService.save).not.toHaveBeenCalled()
        expect(covers.findInFolder).not.toHaveBeenCalled()
        expect(tagReader.read).not.toHaveBeenCalled()
        expect(playlistUtils.read).not.toHaveBeenCalled()
        expect(playlistsService.checkIntegrity).not.toHaveBeenCalled()
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

        const tracks = newAndModified.map(
          ({ path, stats: { mtimeMs, ino } }) => ({
            id: hash(path),
            path,
            media: null,
            tags: {},
            mtimeMs,
            ino
          })
        )
        expect(removedIds).toEqual(missing.map(({ path }) => hash(path)))
        expect(saved).toEqual(tracks)
        expect(tracksService.add).toHaveBeenCalledWith(tracks)
        expect(tracksService.add).toHaveBeenCalledTimes(1)
        expect(tracksService.remove).toHaveBeenCalledWith(removedIds)
        expect(tracksService.remove).toHaveBeenCalledTimes(1)
        expect(playlistsService.save).not.toHaveBeenCalled()
        for (const { path } of newAndModified) {
          expect(covers.findInFolder).toHaveBeenCalledWith(path)
          expect(tagReader.read).toHaveBeenCalledWith(path)
        }
        expect(covers.findInFolder).toHaveBeenCalledTimes(newAndModified.length)
        expect(tagReader.read).toHaveBeenCalledTimes(newAndModified.length)
        expect(playlistUtils.read).not.toHaveBeenCalled()
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
        expect(playlistsService.checkIntegrity).toHaveBeenCalledTimes(1)
      })

      it('finds new files and save them', async () => {
        await provider.compareTracks()
        await sleep(700)
        jest.clearAllMocks()

        const first = join(tree.folder, 'first.mp3')
        const second = join(tree.folder, 'second.ogg')
        const third = join(tree.folder, 'third.flac')

        fs.writeFile(first, faker.lorem.word())
        fs.writeFile(join(tree.folder, 'ignored.png'), faker.lorem.word())
        fs.writeFile(second, faker.lorem.word())
        fs.writeFile(join(tree.folder, 'ignored.jpg'), faker.lorem.word())
        fs.writeFile(third, faker.lorem.word())

        await sleep(700)

        const tracks = [first, second, third].map(path => ({
          id: hash(path),
          path,
          media: null,
          tags: {},
          mtimeMs: expect.any(Number),
          ino: expect.any(Number)
        }))

        expect(tracksService.remove).not.toHaveBeenCalled()
        for (const obj of tracks) {
          expect(tracksService.add).toHaveBeenCalledWith([obj])
          expect(covers.findInFolder).toHaveBeenCalledWith(obj.path)
          expect(tagReader.read).toHaveBeenCalledWith(obj.path)
        }
        expect(tracksService.add).toHaveBeenCalledTimes(tracks.length)
        expect(playlistsService.save).not.toHaveBeenCalled()
        expect(covers.findInFolder).toHaveBeenCalledTimes(tracks.length)
        expect(tagReader.read).toHaveBeenCalledTimes(tracks.length)
        expect(playlistUtils.read).not.toHaveBeenCalled()
        expect(playlistsService.checkIntegrity).toHaveBeenCalledTimes(
          tracks.length
        )
      })

      it('finds modified files and save them', async () => {
        await provider.compareTracks()
        await sleep(700)
        jest.clearAllMocks()

        fs.writeFile(join(tree.folder, 'unsupported.png'), faker.lorem.word())

        const modified = tree.files.slice(2, 6)
        for (const { path } of modified) {
          fs.writeFile(path, faker.lorem.word())
        }

        await sleep(700)

        const tracks = modified.map(({ path }) => ({
          id: hash(path),
          path,
          media: null,
          tags: {},
          mtimeMs: expect.any(Number),
          ino: expect.any(Number)
        }))

        expect(tracksService.remove).not.toHaveBeenCalled()
        for (const obj of tracks) {
          expect(tracksService.add).toHaveBeenCalledWith([obj])
          expect(covers.findInFolder).toHaveBeenCalledWith(obj.path)
          expect(tagReader.read).toHaveBeenCalledWith(obj.path)
        }
        expect(tracksService.add).toHaveBeenCalledTimes(tracks.length)
        expect(playlistsService.save).not.toHaveBeenCalled()
        expect(covers.findInFolder).toHaveBeenCalledTimes(tracks.length)
        expect(tagReader.read).toHaveBeenCalledTimes(tracks.length)
        expect(playlistUtils.read).not.toHaveBeenCalled()
        expect(playlistsService.checkIntegrity).toHaveBeenCalledTimes(
          tracks.length
        )
      })

      it('handles file rename', async () => {
        await provider.compareTracks()
        await sleep(700)
        jest.clearAllMocks()

        const { path } = tree.files[0]
        const { ino } = await fs.stat(path)
        tracksModel.getByPaths.mockResolvedValueOnce([{ id: hash(path), ino }])
        const name = basename(path)
        const newPath = path.replace(name, `renamed${extname(name)}`)
        fs.rename(path, newPath)

        await sleep(700)

        expect(tracksService.remove).not.toHaveBeenCalled()
        expect(tracksService.add).toHaveBeenCalledWith([
          {
            id: hash(path),
            path: newPath,
            media: null,
            tags: {},
            mtimeMs: expect.any(Number),
            ino: expect.any(Number)
          }
        ])
        expect(tracksService.add).toHaveBeenCalledTimes(1)
        expect(playlistsService.save).not.toHaveBeenCalled()
        expect(covers.findInFolder).toHaveBeenCalledTimes(1)
        expect(tagReader.read).toHaveBeenCalledTimes(1)
        expect(playlistUtils.read).not.toHaveBeenCalled()
        expect(playlistsService.checkIntegrity).toHaveBeenCalledTimes(1)
      })

      it('handles folder rename', async () => {
        await provider.compareTracks()
        await sleep(700)
        jest.clearAllMocks()

        const folder = dirname(tree.files[12].path)
        const newPath = folder.replace(basename(folder), 'renamed')
        const modified = tree.files.filter(({ path }) =>
          path.startsWith(folder)
        )

        const inodes = new Map()
        for (const { path } of modified) {
          inodes.set(path, (await fs.stat(path)).ino)
        }
        tracksModel.getByPaths.mockImplementation(async paths =>
          paths.map(path => ({
            id: hash(path),
            ino: inodes.get(path)
          }))
        )
        await fs.move(folder, newPath)

        await sleep(700)

        const tracks = modified.map(({ path }) => ({
          id: hash(path),
          path: path.replace(folder, newPath),
          media: null,
          tags: {},
          mtimeMs: expect.any(Number),
          ino: expect.any(Number)
        }))

        for (const obj of tracks) {
          expect(tracksService.add).toHaveBeenCalledWith([obj])
          expect(covers.findInFolder).toHaveBeenCalledWith(obj.path)
          expect(tagReader.read).toHaveBeenCalledWith(obj.path)
        }
        expect(tracksService.add).toHaveBeenCalledTimes(tracks.length)
        expect(covers.findInFolder).toHaveBeenCalledTimes(tracks.length)
        expect(tagReader.read).toHaveBeenCalledTimes(tracks.length)
        // tracksService.remove, playlistService.save & playlistUtils.read may
        // be called if the random renamed folder contains a playlist file
      })

      it('finds delete files and removes them', async () => {
        const unsupported = join(tree.folder, 'unsupported.png')
        fs.writeFile(unsupported, faker.lorem.word())

        await provider.compareTracks()
        await sleep(700)
        jest.clearAllMocks()

        const removed = tree.files.slice(3, 7)
        for (const { path } of removed) {
          const { ino } = await fs.stat(path)
          tracksModel.getByPaths.mockResolvedValueOnce([
            { id: hash(path), ino }
          ])
          fs.unlink(path)
        }
        tracksModel.getByPaths.mockResolvedValueOnce([])
        fs.unlink(unsupported)

        await sleep(700)

        const tracks = removed.map(({ path }) => ({
          id: hash(path),
          path,
          media: null,
          tags: {},
          mtimeMs: expect.any(Number),
          ino: expect.any(Number)
        }))

        for (const obj of tracks) {
          expect(tracksService.remove).toHaveBeenCalledWith([obj.id])
        }
        expect(tracksService.remove).toHaveBeenCalledTimes(tracks.length)
        expect(tracksService.add).not.toHaveBeenCalled()
        expect(playlistsService.save).not.toHaveBeenCalled()
        expect(covers.findInFolder).not.toHaveBeenCalled()
        expect(tagReader.read).not.toHaveBeenCalled()
        expect(playlistUtils.read).not.toHaveBeenCalled()
        expect(playlistsService.checkIntegrity).toHaveBeenCalledTimes(
          tracks.length
        )
      })

      it('finds additions of playlist files', async () => {
        await provider.compareTracks()
        await sleep(700)
        jest.clearAllMocks()

        const path = join(dirname(playlists[2]), 'new.m3u')
        fs.writeFile(path, '#EXTM3U\ntest.mp3', 'latin1')

        await sleep(700)

        expect(tracksService.add).not.toHaveBeenCalled()
        expect(tracksService.remove).not.toHaveBeenCalled()
        expect(playlistsService.save).toHaveBeenCalledWith(
          {
            id: hash(path),
            name: basename(path).replace('.m3u', ''),
            trackIds: []
          },
          true
        )
        expect(playlistsService.save).toHaveBeenCalledTimes(1)
        expect(covers.findInFolder).not.toHaveBeenCalled()
        expect(tagReader.read).not.toHaveBeenCalled()
        expect(playlistUtils.read).toHaveBeenCalledWith(path)
        expect(playlistUtils.read).toHaveBeenCalledTimes(1)
        expect(playlistsService.checkIntegrity).toHaveBeenCalledTimes(1)
      })

      it('ignores modifications, deletions and additiong of playlist files', async () => {
        await provider.compareTracks()
        await sleep(700)
        jest.clearAllMocks()

        fs.writeFile(playlists[2], '#EXTM3U\ntest.mp3', 'latin1')
        const path = playlists[3]
        tracksModel.getByPaths.mockResolvedValueOnce([])
        fs.unlink(path)

        await sleep(700)

        expect(tracksService.add).not.toHaveBeenCalled()
        expect(tracksService.remove).not.toHaveBeenCalled()
        expect(playlistsService.save).not.toHaveBeenCalled()
        expect(covers.findInFolder).not.toHaveBeenCalled()
        expect(tagReader.read).not.toHaveBeenCalled()
        expect(playlistUtils.read).not.toHaveBeenCalled()
        expect(playlistsService.checkIntegrity).not.toHaveBeenCalled()
      })
    })

    it('stops watching previous folder', async () => {
      await provider.compareTracks()
      jest.clearAllMocks()

      tracksModel.listWithTime.mockResolvedValueOnce(new Map())
      settingsModel.get.mockResolvedValueOnce({ folders: [] })

      await provider.compareTracks()
      await sleep(700)

      fs.writeFile(join(tree.folder, 'first.mp3'), faker.lorem.word())

      await sleep(700)
      expect(tracksService.remove).not.toHaveBeenCalled()
      expect(tracksService.add).not.toHaveBeenCalled()
      expect(playlistsService.checkIntegrity).not.toHaveBeenCalled()
    })
  })
})
