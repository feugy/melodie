'use strict'

const { join } = require('path')
const os = require('os')
const fs = require('fs-extra')
const provider = require('.')
const { albumsModel, tracksModel } = require('../../models')
const { parentName, hash } = require('../../utils')

jest.mock('../../models/tracks')
jest.mock('../../models/albums')

describe('Local provider', () => {
  describe('findArtistArtwork()', () => {
    it('returns no artwork', async () => {
      expect(await provider.findArtistArtwork('coldplay')).toEqual([])
    })
  })

  describe('findAlbumCover()', () => {
    const folder = join(os.tmpdir(), 'melodie-')
    const files = [
      join(folder, 'track1.mp3'),
      join(folder, 'track2.mp3'),
      join(folder, 'track3.mp3'),
      join(folder, 'track4.mp3')
    ]

    beforeEach(async () => {
      jest.resetAllMocks()
      await fs.ensureDir(folder)
      for (const file of files) {
        await fs.ensureFile(file)
      }
    })

    afterEach(async () => {
      await fs.remove(folder)
    })

    it('returns all images inside folder', async () => {
      const album = parentName(files[1])
      const covers = [
        join(
          folder,
          'AlbumArt_{62D46EC5-701B-40A3-B7A7-D66E1E29EECA}_Large.jpg'
        ),
        join(folder, 'Folder.png'),
        join(folder, 'cover.jpeg')
      ]
      for (const file of covers) {
        await fs.ensureFile(file)
      }
      albumsModel.getById.mockResolvedValueOnce({
        trackIds: files.map(file => hash(file))
      })
      tracksModel.getById.mockResolvedValueOnce({
        id: hash(files[0]),
        path: files[0]
      })

      expect(await provider.findAlbumCover(album)).toEqual(
        covers.map(full => ({ full, provider: provider.name }))
      )
      expect(albumsModel.getById).toHaveBeenCalledWith(hash(album))
      expect(tracksModel.getById).toHaveBeenCalledWith(hash(files[0]))
    })

    it('returns nothing when folder does not contain images', async () => {
      const album = parentName(files[1])
      albumsModel.getById.mockResolvedValueOnce({
        trackIds: files.map(file => hash(file))
      })
      tracksModel.getById.mockResolvedValueOnce({
        id: hash(files[0]),
        path: files[0]
      })

      expect(await provider.findAlbumCover(album)).toEqual([])
      expect(albumsModel.getById).toHaveBeenCalledWith(hash(album))
      expect(tracksModel.getById).toHaveBeenCalledWith(hash(files[0]))
    })

    it('returns nothing on unknown folder', async () => {
      const album = parentName(files[1])
      albumsModel.getById.mockResolvedValueOnce(null)

      expect(await provider.findAlbumCover(album)).toEqual([])
      expect(albumsModel.getById).toHaveBeenCalledWith(hash(album))
      expect(tracksModel.getById).not.toHaveBeenCalled()
    })

    it('returns nothing on failure', async () => {
      const album = parentName(files[1])
      albumsModel.getById.mockRejectedValue(new Error('DB is closed'))

      expect(await provider.findAlbumCover(album)).toEqual([])
      expect(albumsModel.getById).toHaveBeenCalledWith(hash(album))
      expect(tracksModel.getById).not.toHaveBeenCalled()
    })
  })
})
