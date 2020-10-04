'use strict'

const fs = require('fs-extra')
const os = require('os')
const { join } = require('path')
const faker = require('faker')
const { findInFolder, findForAlbum } = require('./cover-finder')
const { tracksModel } = require('../../models')
const { hash } = require('../../utils')

jest.mock('../../models/tracks')
jest.mock('electron', () => ({
  dialog: {
    showOpenDialog: jest.fn()
  },
  app: {
    getPath: jest.fn().mockReturnValue('')
  }
}))

describe('Cover finder', () => {
  beforeEach(jest.resetAllMocks)

  describe('findInFolder', () => {
    let path

    beforeEach(async () => {
      path = await fs.mkdtemp(join(os.tmpdir(), 'melodie-'))
    })

    it('returns null for cover-less path', async () => {
      expect(await findInFolder(join(path, 'file.mp3'))).toBe(null)
    })

    it('finds gif', async () => {
      const gif = join(path, 'folder.gif')
      await fs.ensureFile(gif)
      expect(await findInFolder(join(path, 'file.mp3'))).toEqual(gif)
    })

    it('finds png', async () => {
      const png = join(path, 'folder.png')
      await fs.ensureFile(png)
      expect(await findInFolder(join(path, 'file.mp3'))).toEqual(png)
    })

    it('finds jpeg', async () => {
      const jpeg = join(path, 'cover.jpeg')
      await fs.ensureFile(jpeg)
      expect(await findInFolder(join(path, 'file.mp3'))).toEqual(jpeg)
    })

    it('finds capitalized', async () => {
      const jpeg = join(path, 'Cover.jpeg')
      await fs.ensureFile(jpeg)
      expect(await findInFolder(join(path, 'file.mp3'))).toEqual(jpeg)
    })

    describe('given cover.jpg', () => {
      let jpg
      beforeEach(async () => {
        jpg = join(path, 'cover.jpg')
        await fs.ensureFile(jpg)
      })

      it('finds it for a track', async () => {
        expect(await findInFolder(join(path, 'file.mp3'))).toEqual(jpg)
      })

      it('finds it for an album', async () => {
        expect(await findInFolder(path)).toEqual(jpg)
      })
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

    beforeEach(async () => {
      await fs.ensureDir(folder)
      for (const file of files) {
        await fs.ensureFile(file)
      }
    })

    afterEach(async () => {
      await fs.remove(folder)
    })

    it('returns all images inside folders', async () => {
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
      tracksModel.getById.mockResolvedValueOnce({
        id: hash(files[0]),
        path: files[0]
      })

      expect(
        await findForAlbum({
          trackIds: files.map(file => hash(file))
        })
      ).toEqual(covers.map(cover => ({ cover, provider: 'Local' })))
      expect(tracksModel.getById).toHaveBeenCalledWith(hash(files[0]))
      expect(tracksModel.getById).toHaveBeenCalledTimes(1)
    })

    it('returns nothing when folder does not contain images', async () => {
      tracksModel.getById.mockResolvedValueOnce({
        id: hash(files[0]),
        path: files[0]
      })

      expect(
        await findForAlbum({
          trackIds: files.map(file => hash(file))
        })
      ).toEqual([])
      expect(tracksModel.getById).toHaveBeenCalledWith(hash(files[0]))
      expect(tracksModel.getById).toHaveBeenCalledTimes(1)
    })
  })
})
