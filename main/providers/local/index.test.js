'use strict'

const { join } = require('path')
const os = require('os')
const fs = require('fs-extra')
const faker = require('faker')
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
    const folder = join(os.tmpdir(), 'melodie', faker.random.uuid())
    const files = [
      join(folder, 'track1.mp3'),
      join(folder, 'track2.mp3'),
      join(folder, 'track3.mp3'),
      join(folder, 'track4.mp3')
    ]

    const folder2 = join(os.tmpdir(), 'melodie', faker.random.uuid())
    const files2 = [
      join(folder2, 'track1.mp3'),
      join(folder2, 'track2.mp3'),
      join(folder2, 'track3.mp3'),
      join(folder2, 'track4.mp3')
    ]

    beforeEach(async () => {
      jest.resetAllMocks()
      await fs.ensureDir(folder.concat(folder2))
      for (const file of files.concat(files2)) {
        await fs.ensureFile(file)
      }
    })

    afterEach(async () => {
      await fs.remove(folder)
      await fs.remove(folder2)
    })

    it('returns all images inside folders', async () => {
      const album = parentName(files[1])
      const covers = [
        join(
          folder,
          'AlbumArt_{62D46EC5-701B-40A3-B7A7-D66E1E29EECA}_Large.jpg'
        ),
        join(folder, 'Folder.png'),
        join(folder, 'cover.jpeg'),
        join(folder2, 'Folder.png'),
        join(folder2, 'cover.jpeg')
      ]
      for (const file of covers) {
        await fs.ensureFile(file)
      }
      albumsModel.getByName.mockResolvedValueOnce([
        {
          trackIds: files.map(file => hash(file))
        },
        {
          trackIds: files2.map(file => hash(file))
        }
      ])
      tracksModel.getById
        .mockResolvedValueOnce({
          id: hash(files[0]),
          path: files[0]
        })
        .mockResolvedValueOnce({
          id: hash(files2[0]),
          path: files2[0]
        })

      expect(await provider.findAlbumCover(album)).toEqual(
        covers.map(full => ({ full, provider: provider.name }))
      )
      expect(albumsModel.getByName).toHaveBeenCalledWith(album)
      expect(tracksModel.getById).toHaveBeenCalledWith(hash(files[0]))
      expect(tracksModel.getById).toHaveBeenCalledWith(hash(files2[0]))
      expect(tracksModel.getById).toHaveBeenCalledTimes(2)
    })

    it('returns nothing when folder does not contain images', async () => {
      const album = parentName(files[1])
      albumsModel.getByName.mockResolvedValueOnce([
        {
          trackIds: files.map(file => hash(file))
        }
      ])
      tracksModel.getById.mockResolvedValueOnce({
        id: hash(files[0]),
        path: files[0]
      })

      expect(await provider.findAlbumCover(album)).toEqual([])
      expect(albumsModel.getByName).toHaveBeenCalledWith(album)
      expect(tracksModel.getById).toHaveBeenCalledWith(hash(files[0]))
    })

    it('returns nothing on unknown folder', async () => {
      const album = parentName(files[1])
      albumsModel.getByName.mockResolvedValueOnce([])

      expect(await provider.findAlbumCover(album)).toEqual([])
      expect(albumsModel.getByName).toHaveBeenCalledWith(album)
      expect(tracksModel.getById).not.toHaveBeenCalled()
    })

    it('returns nothing on failure', async () => {
      const album = parentName(files[1])
      albumsModel.getByName.mockRejectedValue(new Error('faker error'))

      expect(await provider.findAlbumCover(album)).toEqual([])
      expect(albumsModel.getByName).toHaveBeenCalledWith(album)
      expect(tracksModel.getById).not.toHaveBeenCalled()
    })
  })
})
