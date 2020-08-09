'use strict'

const { join, dirname } = require('path')
const fs = require('fs-extra')
const faker = require('faker')
const provider = require('.')
const { makeFolder } = require('../../tests')
const { settingsModel } = require('../../models')
const { parentName } = require('../../utils')

jest.mock('../../models/settings')

describe('Local provider', () => {
  describe('findArtistArtwork()', () => {
    it('returns no artwork', async () => {
      expect(await provider.findArtistArtwork('coldplay')).toEqual([])
    })
  })

  describe('findAlbumCover()', () => {
    let folder
    let files

    beforeEach(async () => {
      ;({ folder, files } = await makeFolder({ depth: 4, fileNb: 10 }))
    })

    afterEach(async () => {
      try {
        await fs.remove(folder)
      } catch (err) {
        // ignore removal error
      }
    })

    it('returns all images inside folder', async () => {
      const album = parentName(files[5].path)
      const parent = dirname(files[5].path)
      const covers = [
        join(
          parent,
          'AlbumArt_{62D46EC5-701B-40A3-B7A7-D66E1E29EECA}_Large.jpg'
        ),
        join(parent, 'Folder.png'),
        join(parent, 'cover.jpeg')
      ]
      for (const file of covers) {
        await fs.ensureFile(file)
      }
      settingsModel.get.mockResolvedValue({ folders: [folder] })

      expect(await provider.findAlbumCover(album)).toEqual(
        covers.map(full => ({ full, preview: full, provider: provider.name }))
      )
    })

    it('returns nothing when folder does not contain images', async () => {
      const album = parentName(files[3].path)
      settingsModel.get.mockResolvedValue({ folders: [folder] })

      expect(await provider.findAlbumCover(album)).toEqual([])
    })

    it('returns nothing on unknown folder', async () => {
      const album = parentName(faker.system.fileName())
      settingsModel.get.mockResolvedValue({ folders: [folder] })

      expect(await provider.findAlbumCover(album)).toEqual([])
    })
  })
})
