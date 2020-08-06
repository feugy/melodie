'use strict'

const faker = require('faker')
const electron = require('electron')
const os = require('os')
const fs = require('fs-extra')
const { constants } = require('fs')
const { resolve } = require('path')
const { artistsModel } = require('../models/artists')
const manager = require('./media-manager')

jest.mock('../models/artists')
jest.mock('electron', () => ({ app: { getPath: jest.fn() } }))

describe('Media manager', () => {
  const artist = {
    id: faker.random.number({ min: 9999 }),
    name: faker.name.findName(),
    media: null,
    linked: [],
    trackIds: []
  }

  const media = resolve(os.tmpdir(), 'media', `${artist.id}.jpg`)

  beforeEach(async () => {
    jest.resetAllMocks()
    electron.app.getPath.mockReturnValue(os.tmpdir())
    try {
      await fs.unlink(media)
    } catch (err) {
      // ignore missing files
    }
  })

  describe.each([
    [
      'remote',
      'https://www.theaudiodb.com/images/media/artist/thumb/uxrqxy1347913147.jpg'
    ],
    ['local', resolve(__dirname, '..', '..', 'fixtures', 'avatar.jpg')]
  ])('given a %s media', (unused, source) => {
    it('downloads and adds media artist', async () => {
      artistsModel.getById.mockResolvedValueOnce(artist)

      await manager.saveForArtist(artist.id, source)

      expect(artistsModel.save).toHaveBeenCalledWith({
        ...artist,
        media
      })
      expect(artistsModel.save).toHaveBeenCalledTimes(1)
      expect(await fs.access(media, constants.R_OK))
    })

    it('downloads and replace media artist', async () => {
      artistsModel.getById.mockResolvedValueOnce({
        ...artist,
        media
      })
      const oldContent = 'old content'
      await fs.ensureFile(media)
      await fs.writeFile(media, oldContent)

      await manager.saveForArtist(artist.id, source)

      expect(artistsModel.save).toHaveBeenCalledWith({
        ...artist,
        media
      })
      expect(artistsModel.save).toHaveBeenCalledTimes(1)
      expect(await fs.access(media, constants.R_OK))
      const content = await fs.readFile(media, 'utf8')
      expect(content).not.toEqual(oldContent)
      expect(content).toBeDefined()
    })

    it('ignores unknown artist', async () => {
      artistsModel.getById.mockResolvedValueOnce(null)
      await manager.saveForArtist(artist.id, source)

      expect(artistsModel.save).not.toHaveBeenCalled()
      await expect(fs.access(media, constants.R_OK)).rejects.toThrow(/ENOENT/)
    })
  })

  it('handles download failure', async () => {
    artistsModel.getById.mockResolvedValueOnce({ ...artist, media })
    const oldContent = 'old content'
    await fs.ensureFile(media)
    await fs.writeFile(media, oldContent)

    await manager.saveForArtist(artist.id, 'https://doesnotexist.ukn/image.jpg')

    expect(artistsModel.save).not.toHaveBeenCalled()
    const content = await fs.readFile(media, 'utf8')
    expect(content).toEqual(oldContent)
  }, 10e3)

  it('handles unknown source file', async () => {
    artistsModel.getById.mockResolvedValueOnce({ ...artist, media })
    const oldContent = 'old content'
    await fs.ensureFile(media)
    await fs.writeFile(media, oldContent)

    await manager.saveForArtist(artist.id, '/user/doesnotexist/source.jpg')

    expect(artistsModel.save).not.toHaveBeenCalled()
    const content = await fs.readFile(media, 'utf8')
    expect(content).toEqual(oldContent)
  }, 10e3)
})
