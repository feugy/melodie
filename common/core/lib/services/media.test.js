'use strict'

const faker = require('faker')
const electron = require('electron')
const os = require('os')
const fs = require('fs-extra')
const { constants } = require('fs')
const { resolve } = require('path')
const {
  artistsModel,
  albumsModel,
  tracksModel,
  settingsModel
} = require('../models')
const { broadcast, dayMs } = require('../utils')
const { sleep } = require('../tests')
const mediaService = require('./media')
const {
  discogs,
  audiodb,
  local,
  TooManyRequestsError
} = require('../providers')

jest.mock('../providers/audiodb')
jest.mock('../providers/discogs')
jest.mock('../providers/local')
jest.mock('../models/artists')
jest.mock('../models/albums')
jest.mock('../models/tracks')
jest.mock('../models/settings')
jest.mock('../utils/electron-remote')

const fixtures = resolve(__dirname, '..', '..', '..', 'fixtures')

describe('Media service', () => {
  beforeEach(jest.clearAllMocks)

  describe('findArtistArtwork', () => {
    it('returns artwork for artist', async () => {
      const artworks = [
        {
          artwork:
            'https://www.theaudiodb.com/images/media/artist/thumb/uxrqxy1347913147.jpg'
        },
        {
          artwork:
            'https://www.theaudiodb.com/images/media/artist/fanart/spvryu1347980801.jpg'
        },
        {
          artwork:
            'https://img.discogs.com/RLkA5Qmo6_eNpWGjioaI4bJZUB4=/600x600/smart/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/A-29735-1591800654-2186.jpeg.jpg'
        }
      ]
      audiodb.findArtistArtwork.mockResolvedValueOnce(artworks.slice(0, 2))
      discogs.findArtistArtwork.mockResolvedValueOnce(artworks.slice(2))
      local.findArtistArtwork.mockResolvedValueOnce([])

      expect(await mediaService.findForArtist('coldplay')).toEqual(artworks)
    })

    it('does not fail error', async () => {
      const artworks = [
        {
          artwork:
            'https://www.theaudiodb.com/images/media/artist/thumb/uxrqxy1347913147.jpg'
        },
        {
          artwork: resolve(fixtures, 'cover.jpg')
        }
      ]
      audiodb.findArtistArtwork.mockResolvedValueOnce(artworks.slice(0, 1))
      discogs.findArtistArtwork.mockRejectedValueOnce(
        new TooManyRequestsError()
      )
      local.findArtistArtwork.mockResolvedValueOnce(artworks.slice(1))

      expect(await mediaService.findForArtist('coldplay')).toEqual(artworks)
    })

    it('does not search falsy values', async () => {
      expect(await mediaService.findForArtist(null)).toEqual([])
      expect(await mediaService.findForArtist('')).toEqual([])
      expect(await mediaService.findForArtist(false)).toEqual([])

      expect(audiodb.findArtistArtwork).not.toHaveBeenCalled()
      expect(discogs.findArtistArtwork).not.toHaveBeenCalled()
      expect(local.findArtistArtwork).not.toHaveBeenCalled()
    })
  })

  describe('findAlbumCover', () => {
    it('returns cover for album', async () => {
      const covers = [
        {
          cover:
            'https://www.theaudiodb.com/images/media/album/thumb/swxywp1367234202.jpg'
        },
        {
          cover:
            'https://img.discogs.com/eTfvDOHIvDIHuMFHv28H6_MG-b0=/fit-in/500x505/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/R-3069838-1466508617-4579.jpeg.jpg'
        },
        {
          cover:
            'https://img.discogs.com/hp9V11cwfD4e4lWid6zV5j8P-g8=/fit-in/557x559/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/R-5589468-1397410589-8616.jpeg.jpg'
        },
        {
          cover:
            'https://img.discogs.com/QpNOv7TPg9VIkdbCYKqEtNbCN04=/fit-in/600x595/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/R-2898241-1306263310.jpeg.jpg'
        }
      ]
      audiodb.findAlbumCover.mockResolvedValueOnce(covers.slice(0, 1))
      discogs.findAlbumCover.mockResolvedValueOnce(covers.slice(1))
      local.findAlbumCover.mockResolvedValueOnce([])

      expect(await mediaService.findForAlbum('Parachutes')).toEqual(covers)
    })

    it('does not fail on error', async () => {
      const covers = [
        {
          cover:
            'https://img.discogs.com/eTfvDOHIvDIHuMFHv28H6_MG-b0=/fit-in/500x505/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/R-3069838-1466508617-4579.jpeg.jpg'
        },
        {
          cover: resolve(fixtures, 'cover.jpg')
        }
      ]
      audiodb.findAlbumCover.mockRejectedValueOnce(new TooManyRequestsError())
      discogs.findAlbumCover.mockResolvedValueOnce(covers.slice(0, 1))
      local.findAlbumCover.mockResolvedValueOnce(covers.slice(1))

      expect(await mediaService.findForAlbum('Parachutes')).toEqual(covers)
    })

    it('does not search falsy values', async () => {
      expect(await mediaService.findForAlbum(null)).toEqual([])
      expect(await mediaService.findForAlbum('')).toEqual([])
      expect(await mediaService.findForAlbum(false)).toEqual([])

      expect(audiodb.findAlbumCover).not.toHaveBeenCalled()
      expect(discogs.findAlbumCover).not.toHaveBeenCalled()
      expect(local.findAlbumCover).not.toHaveBeenCalled()
    })
  })

  describe('saveForAlbum()', () => {
    const name = faker.commerce.productName()
    const track1 = {
      id: faker.random.number({ min: 9999 }),
      path: resolve(os.tmpdir(), name, faker.system.fileName()),
      media: null
    }
    const track2 = {
      id: faker.random.number({ min: 9999 }),
      path: resolve(os.tmpdir(), name, faker.system.fileName()),
      media: null
    }
    const album = {
      id: faker.random.number({ min: 9999 }),
      name,
      media: null,
      trackIds: [track1.id, track2.id]
    }

    describe.each([
      [
        'remote',
        'https://www.theaudiodb.com/images/media/album/thumb/swxywp1367234202.jpg',
        resolve(os.tmpdir(), name, `cover.jpeg`)
      ],
      [
        'local',
        resolve(fixtures, 'cover.jpg'),
        resolve(os.tmpdir(), name, 'cover.jpg')
      ]
    ])('given a %s media', (unused, source, media) => {
      beforeEach(async () => {
        electron.app.getPath.mockReturnValue(os.tmpdir())
        try {
          await fs.unlink(media)
        } catch (err) {
          // ignore missing files
        }
      })
      it('downloads and save album cover', async () => {
        const savedAlbum = { ...album, media }
        const savedTrack1 = { ...track1, media }
        const savedTrack2 = { ...track2, media }
        albumsModel.getById.mockResolvedValueOnce(album)
        tracksModel.getByIds.mockResolvedValueOnce([track1, track2])
        albumsModel.save.mockResolvedValueOnce({ saved: [savedAlbum] })
        tracksModel.save.mockResolvedValueOnce({
          saved: [savedTrack1, savedTrack2]
        })

        await mediaService.saveForAlbum(album.id, source)

        expect(albumsModel.save).toHaveBeenCalledWith(savedAlbum)
        expect(albumsModel.save).toHaveBeenCalledTimes(1)
        expect(tracksModel.save).toHaveBeenCalledWith([
          savedTrack1,
          savedTrack2
        ])
        expect(tracksModel.save).toHaveBeenCalledTimes(1)
        expect(await fs.access(media, constants.R_OK))
        expect(broadcast).toHaveBeenNthCalledWith(1, 'album-changes', [
          album,
          savedAlbum
        ])
        expect(broadcast).toHaveBeenNthCalledWith(2, 'track-changes', [
          track1,
          track2
        ])
        expect(broadcast).toHaveBeenNthCalledWith(3, 'track-changes', [
          savedTrack1,
          savedTrack2
        ])
        expect(broadcast).toHaveBeenCalledTimes(3)
      })

      it('downloads and replace album cover', async () => {
        const savedAlbum = { ...album, media }
        const savedTrack1 = { ...track1, media }
        const savedTrack2 = { ...track2, media }
        albumsModel.getById.mockResolvedValueOnce(savedAlbum)
        tracksModel.getByIds.mockResolvedValueOnce([track1, track2])
        albumsModel.save.mockResolvedValueOnce({ saved: [savedAlbum] })
        tracksModel.save.mockResolvedValueOnce({
          saved: [savedTrack1, savedTrack2]
        })
        const oldContent = 'old content'
        await fs.ensureFile(media)
        await fs.writeFile(media, oldContent)

        await mediaService.saveForAlbum(album.id, source)

        expect(albumsModel.save).toHaveBeenCalledWith(savedAlbum)
        expect(albumsModel.save).toHaveBeenCalledTimes(1)
        expect(await fs.access(media, constants.R_OK))
        const content = await fs.readFile(media, 'utf8')
        expect(content).not.toEqual(oldContent)
        expect(content).toBeDefined()
        expect(broadcast).toHaveBeenNthCalledWith(1, 'album-changes', [
          album,
          savedAlbum
        ])
        expect(broadcast).toHaveBeenNthCalledWith(2, 'track-changes', [
          track1,
          track2
        ])
        expect(broadcast).toHaveBeenNthCalledWith(3, 'track-changes', [
          savedTrack1,
          savedTrack2
        ])
        expect(broadcast).toHaveBeenCalledTimes(3)
      })

      it('ignores unknown album', async () => {
        albumsModel.getById.mockResolvedValueOnce(null)
        await mediaService.saveForAlbum(album.id, source)

        expect(albumsModel.save).not.toHaveBeenCalled()
        expect(tracksModel.getByIds).not.toHaveBeenCalled()
        expect(tracksModel.save).not.toHaveBeenCalled()
        await expect(fs.access(media, constants.R_OK)).rejects.toThrow(/ENOENT/)
        expect(broadcast).not.toHaveBeenCalled()
      })
    })

    it('handles download failure', async () => {
      const media = resolve(os.tmpdir(), 'media', `${album.id}.jpg`)
      albumsModel.getById.mockResolvedValueOnce({ ...album, media })
      tracksModel.getByIds.mockResolvedValueOnce([track1, track2])
      const oldContent = 'old content'
      await fs.ensureFile(media)
      await fs.writeFile(media, oldContent)

      await mediaService.saveForAlbum(
        album.id,
        'https://doesnotexist.ukn/image.jpg'
      )

      expect(albumsModel.save).not.toHaveBeenCalled()
      expect(tracksModel.save).not.toHaveBeenCalled()
      const content = await fs.readFile(media, 'utf8')
      expect(content).toEqual(oldContent)
      expect(broadcast).not.toHaveBeenCalled()
    }, 10e3)

    it('handles unknown source file', async () => {
      const media = resolve(os.tmpdir(), 'media', `${album.id}.jpg`)
      albumsModel.getById.mockResolvedValueOnce({ ...album, media })
      tracksModel.getByIds.mockResolvedValueOnce([track1, track2])
      const oldContent = 'old content'
      await fs.ensureFile(media)
      await fs.writeFile(media, oldContent)

      await mediaService.saveForAlbum(album.id, '/user/doesnotexist/source.jpg')

      expect(albumsModel.save).not.toHaveBeenCalled()
      expect(tracksModel.save).not.toHaveBeenCalled()
      const content = await fs.readFile(media, 'utf8')
      expect(content).toEqual(oldContent)
      expect(broadcast).not.toHaveBeenCalled()
    }, 10e3)
  })

  describe('saveForArtist()', () => {
    const artist = {
      id: faker.random.number({ min: 9999 }),
      name: faker.name.findName(),
      media: null,
      trackIds: []
    }

    describe.each([
      [
        'remote',
        'https://www.theaudiodb.com/images/media/artist/thumb/uxrqxy1347913147.jpg',
        resolve(os.tmpdir(), 'melodie-media', `${artist.id}.jpeg`)
      ],
      [
        'local',
        resolve(fixtures, 'avatar.jpg'),
        resolve(os.tmpdir(), 'melodie-media', `${artist.id}.jpg`)
      ]
    ])('given a %s media', (unused, source, media) => {
      beforeEach(async () => {
        electron.app.getPath.mockReturnValue(os.tmpdir())
        try {
          await fs.unlink(media)
        } catch (err) {
          // ignore missing files
        }
      })
      it('downloads and adds media artist', async () => {
        const savedArtist = { ...artist, media }
        artistsModel.getById.mockResolvedValueOnce(artist)
        artistsModel.save.mockResolvedValueOnce({ saved: [savedArtist] })

        await mediaService.saveForArtist(artist.id, source)

        expect(artistsModel.save).toHaveBeenCalledWith(savedArtist)
        expect(artistsModel.save).toHaveBeenCalledTimes(1)
        expect(await fs.access(media, constants.R_OK))
        expect(broadcast).toHaveBeenCalledWith('artist-changes', [
          { ...artist, media: null },
          savedArtist
        ])
        expect(broadcast).toHaveBeenCalledTimes(1)
      })

      it('downloads and replace media artist', async () => {
        const savedArtist = { ...artist, media }
        artistsModel.getById.mockResolvedValueOnce(savedArtist)
        artistsModel.save.mockResolvedValueOnce({ saved: [savedArtist] })
        const oldContent = 'old content'
        await fs.ensureFile(media)
        await fs.writeFile(media, oldContent)

        await mediaService.saveForArtist(artist.id, source)

        expect(artistsModel.save).toHaveBeenCalledWith(savedArtist)
        expect(artistsModel.save).toHaveBeenCalledTimes(1)
        expect(await fs.access(media, constants.R_OK))
        const content = await fs.readFile(media, 'utf8')
        expect(content).not.toEqual(oldContent)
        expect(content).toBeDefined()
        expect(broadcast).toHaveBeenCalledWith('artist-changes', [
          { ...artist, media: null },
          savedArtist
        ])
        expect(broadcast).toHaveBeenCalledTimes(1)
      })

      it('ignores unknown artist', async () => {
        artistsModel.getById.mockResolvedValueOnce(null)
        await mediaService.saveForArtist(artist.id, source)

        expect(artistsModel.save).not.toHaveBeenCalled()
        await expect(fs.access(media, constants.R_OK)).rejects.toThrow(/ENOENT/)
        expect(broadcast).not.toHaveBeenCalled()
      })
    })

    it('handles download failure', async () => {
      const media = resolve(os.tmpdir(), 'media', `${artist.id}.jpg`)
      artistsModel.getById.mockResolvedValueOnce({ ...artist, media })
      const oldContent = 'old content'
      await fs.ensureFile(media)
      await fs.writeFile(media, oldContent)

      await mediaService.saveForArtist(
        artist.id,
        'https://doesnotexist.ukn/image.jpg'
      )

      expect(artistsModel.save).not.toHaveBeenCalled()
      const content = await fs.readFile(media, 'utf8')
      expect(content).toEqual(oldContent)
      expect(broadcast).not.toHaveBeenCalled()
    }, 10e3)

    it('handles unknown source file', async () => {
      const media = resolve(os.tmpdir(), 'media', `${artist.id}.jpg`)
      artistsModel.getById.mockResolvedValueOnce({ ...artist, media })
      const oldContent = 'old content'
      await fs.ensureFile(media)
      await fs.writeFile(media, oldContent)

      await mediaService.saveForArtist(
        artist.id,
        '/user/doesnotexist/source.jpg'
      )

      expect(artistsModel.save).not.toHaveBeenCalled()
      const content = await fs.readFile(media, 'utf8')
      expect(content).toEqual(oldContent)
      expect(broadcast).not.toHaveBeenCalled()
    }, 10e3)
  })

  describe('triggerArtistsEnrichment', () => {
    beforeEach(async () => {
      electron.app.getPath.mockReturnValue(os.tmpdir())
      await fs.ensureDir(resolve(os.tmpdir(), 'melodie-media'))
    })

    afterEach(() => mediaService.stopEnrichment())

    it('saves first returned artwork for artist', async () => {
      const artists = [
        {
          id: faker.random.number({ min: 9999 }),
          name: faker.name.findName(),
          media: null,
          trackIds: []
        },
        {
          id: faker.random.number({ min: 9999 }),
          name: faker.name.findName(),
          media: null,
          trackIds: []
        }
      ]
      const media = resolve(fixtures, 'cover.jpg')
      artistsModel.listMedialess.mockResolvedValueOnce(artists)
      artistsModel.getById.mockImplementation(async id =>
        artists.find(artist => artist.id === id)
      )
      artistsModel.save.mockImplementation(async artist => ({
        saved: [artist]
      }))
      local.findArtistArtwork.mockImplementation(async searched =>
        searched === artists[0].name
          ? [
              {
                artwork: media,
                provider: local.name
              },
              {
                artwork: resolve(
                  __dirname,
                  '..',
                  '..',
                  'fixtures',
                  'avatar.jpg'
                ),
                provider: local.name
              }
            ]
          : []
      )
      audiodb.findArtistArtwork.mockImplementation(async searched =>
        searched === artists[1].name
          ? [
              {
                artwork:
                  'https://www.theaudiodb.com/images/media/artist/thumb/uxrqxy1347913147.jpg',
                provider: audiodb.name
              }
            ]
          : []
      )
      discogs.findArtistArtwork.mockResolvedValue([])
      const savedArtists = artists.map(artist => ({
        ...artist,
        media: resolve(
          os.tmpdir(),
          'melodie-media',
          `${artist.id}.${artist === artists[0] ? 'jpg' : 'jpeg'}`
        )
      }))

      const now = Date.now()
      mediaService.triggerArtistsEnrichment(6000)
      await sleep(1000)

      expect(await fs.access(savedArtists[0].media, constants.R_OK))
      expect(await fs.readFile(savedArtists[0].media, 'utf8')).toEqual(
        await fs.readFile(media, 'utf8')
      )

      expect(local.findArtistArtwork).toHaveBeenCalledWith(artists[0].name)
      expect(local.findArtistArtwork).toHaveBeenCalledWith(artists[1].name)
      expect(local.findArtistArtwork).toHaveBeenCalledTimes(2)
      expect(audiodb.findArtistArtwork).toHaveBeenCalledWith(artists[1].name)
      expect(audiodb.findArtistArtwork).toHaveBeenCalledTimes(1)
      expect(discogs.findArtistArtwork).not.toHaveBeenCalled()
      expect(artistsModel.listMedialess).toHaveBeenCalledTimes(1)
      expect(artistsModel.listMedialess.mock.calls[0][0]).toBeWithin(
        now - dayMs,
        now - dayMs + 5
      )
      expect(artistsModel.save).toHaveBeenCalledWith(savedArtists[0])
      expect(artistsModel.save).toHaveBeenCalledWith(savedArtists[1])
      expect(artistsModel.save).toHaveBeenCalledTimes(2)
      expect(broadcast).toHaveBeenCalledWith('artist-changes', [
        {
          ...savedArtists[0],
          media: null
        },
        savedArtists[0]
      ])
      expect(broadcast).toHaveBeenCalledWith('artist-changes', [
        {
          ...savedArtists[1],
          media: null
        },
        savedArtists[1]
      ])
      expect(broadcast).toHaveBeenCalledTimes(2)
    })

    it('skips artists with no names', async () => {
      const artists = [
        {
          id: faker.random.number({ min: 9999 }),
          name: null,
          media: null,
          trackIds: []
        },
        {
          id: faker.random.number({ min: 9999 }),
          name: faker.name.findName(),
          media: null,
          trackIds: []
        }
      ]
      artistsModel.listMedialess.mockResolvedValueOnce(artists)
      artistsModel.getById.mockImplementation(async id =>
        artists.find(artist => artist.id === id)
      )
      artistsModel.save.mockImplementation(async artist => ({
        saved: [artist]
      }))
      local.findArtistArtwork.mockResolvedValue([])
      audiodb.findArtistArtwork.mockResolvedValue([])
      discogs.findArtistArtwork.mockResolvedValue([])

      const now = Date.now()
      mediaService.triggerArtistsEnrichment(6000)
      await sleep(1000)

      expect(local.findArtistArtwork).toHaveBeenCalledWith(artists[1].name)
      expect(local.findArtistArtwork).toHaveBeenCalledTimes(1)
      expect(audiodb.findArtistArtwork).toHaveBeenCalledWith(artists[1].name)
      expect(audiodb.findArtistArtwork).toHaveBeenCalledTimes(1)
      expect(discogs.findArtistArtwork).toHaveBeenCalledWith(artists[1].name)
      expect(discogs.findArtistArtwork).toHaveBeenCalledTimes(1)
      expect(artistsModel.listMedialess).toHaveBeenCalledTimes(1)
      expect(artistsModel.save).toHaveBeenCalledWith({
        ...artists[1],
        processedEpoch: now
      })
      expect(artistsModel.save).toHaveBeenCalledTimes(1)
      expect(broadcast).not.toHaveBeenCalled()
    })

    it('saves processing date on artist with no artwork', async () => {
      const artist = {
        id: faker.random.number({ min: 9999 }),
        name: faker.name.findName(),
        media: null,
        trackIds: []
      }
      artistsModel.listMedialess.mockResolvedValueOnce([artist])
      artistsModel.save.mockImplementation(async artist => ({
        saved: [artist]
      }))
      local.findArtistArtwork.mockResolvedValue([])
      audiodb.findArtistArtwork.mockResolvedValue([])
      discogs.findArtistArtwork.mockResolvedValue([])

      const now = Date.now()
      mediaService.triggerArtistsEnrichment(6000)
      await sleep(1000)

      expect(artistsModel.listMedialess).toHaveBeenCalledTimes(1)
      expect(artistsModel.listMedialess.mock.calls[0][0]).toBeWithin(
        now - dayMs,
        now - dayMs + 5
      )
      expect(artistsModel.save).toHaveBeenCalledWith({
        ...artist,
        processedEpoch: now
      })
      expect(artistsModel.save).toHaveBeenCalledTimes(1)
      expect(broadcast).not.toHaveBeenCalled()
    })

    it('retries artist with no artwork but at least one restricted provided', async () => {
      const artists = [
        {
          id: faker.random.number({ min: 9999 }),
          name: faker.name.findName(),
          media: null,
          trackIds: []
        },
        {
          id: faker.random.number({ min: 9999 }),
          name: faker.name.findName(),
          media: null,
          trackIds: []
        }
      ]
      artistsModel.listMedialess.mockResolvedValueOnce(artists)
      artistsModel.getById.mockImplementation(async id =>
        artists.find(artist => artist.id === id)
      )
      artistsModel.save.mockImplementation(async artist => ({
        saved: [artist]
      }))
      local.findArtistArtwork.mockResolvedValue([])
      let i = 0
      audiodb.findArtistArtwork.mockImplementation(async () => {
        if (++i <= 1) {
          throw new TooManyRequestsError()
        }
        return []
      })
      discogs.findArtistArtwork.mockResolvedValue([])

      const now = Date.now()
      mediaService.triggerArtistsEnrichment(6000)
      await sleep(1000)

      for (const provider of [local, audiodb, discogs]) {
        expect(provider.findArtistArtwork).toHaveBeenNthCalledWith(
          1,
          artists[0].name
        )
        expect(provider.findArtistArtwork).toHaveBeenNthCalledWith(
          2,
          artists[1].name
        )
        expect(provider.findArtistArtwork).toHaveBeenNthCalledWith(
          3,
          artists[0].name
        )
        expect(provider.findArtistArtwork).toHaveBeenCalledTimes(3)
      }
      expect(artistsModel.listMedialess).toHaveBeenCalledTimes(1)
      expect(artistsModel.listMedialess.mock.calls[0][0]).toBeWithin(
        now - dayMs,
        now - dayMs + 5
      )
      expect(artistsModel.save).toHaveBeenCalledWith({
        ...artists[0],
        processedEpoch: now
      })
      expect(artistsModel.save).toHaveBeenCalledWith({
        ...artists[1],
        processedEpoch: now
      })
      expect(artistsModel.save).toHaveBeenCalledTimes(2)
      expect(broadcast).not.toHaveBeenCalled()
    })

    it('does not process more than N artists per minute', async () => {
      const artists = Array.from({ length: 5 }, () => ({
        id: faker.random.number({ min: 9999 }),
        name: faker.name.findName(),
        media: null,
        trackIds: []
      }))
      artistsModel.listMedialess.mockResolvedValueOnce(artists)
      artistsModel.getById.mockImplementation(async id =>
        artists.find(artist => artist.id === id)
      )
      artistsModel.save.mockImplementation(async artist => ({
        saved: [artist]
      }))
      local.findArtistArtwork.mockResolvedValue([
        {
          artwork: resolve(fixtures, 'cover.jpg'),
          provider: local.name
        }
      ])
      audiodb.findArtistArtwork.mockResolvedValue([])
      discogs.findArtistArtwork.mockResolvedValue([])
      const savedArtists = artists.map(artist => ({
        ...artist,
        media: resolve(os.tmpdir(), 'melodie-media', `${artist.id}.jpg`)
      }))

      const now = Date.now()
      mediaService.triggerArtistsEnrichment(60)
      await sleep(1500)

      expect(local.findArtistArtwork).toHaveBeenCalledWith(artists[0].name)
      expect(local.findArtistArtwork).toHaveBeenCalledTimes(1)
      expect(audiodb.findArtistArtwork).not.toHaveBeenCalled()
      expect(discogs.findArtistArtwork).not.toHaveBeenCalled()
      expect(artistsModel.listMedialess).toHaveBeenCalledTimes(1)
      expect(artistsModel.listMedialess.mock.calls[0][0]).toBeWithin(
        now - dayMs,
        now - dayMs + 5
      )
      expect(artistsModel.save).toHaveBeenCalledWith(savedArtists[0])
      expect(artistsModel.save).toHaveBeenCalledTimes(1)
      expect(broadcast).toHaveBeenCalledWith('artist-changes', [
        {
          ...savedArtists[0],
          media: null
        },
        savedArtists[0]
      ])
      expect(broadcast).toHaveBeenCalledTimes(1)
    })

    it('stops previous enrichment', async () => {
      const tracks = Array.from({ length: 5 }, () => ({
        id: faker.random.number({ min: 9999 }),
        path: resolve(os.tmpdir(), 'media', faker.system.fileName())
      }))
      const albums = Array.from({ length: 5 }, (v, i) => ({
        id: faker.random.number({ min: 9999 }),
        name: faker.commerce.productName(),
        media: null,
        trackIds: [tracks[i].id]
      }))
      albumsModel.listMedialess.mockResolvedValueOnce(albums)

      const artists = Array.from({ length: 5 }, () => ({
        id: faker.random.number({ min: 9999 }),
        name: faker.name.findName(),
        media: null,
        trackIds: []
      }))
      artistsModel.listMedialess.mockResolvedValue(artists)
      artistsModel.getById.mockImplementation(async id =>
        artists.find(artist => artist.id === id)
      )
      artistsModel.save.mockImplementation(async artist => ({
        saved: [artist]
      }))
      local.findArtistArtwork.mockResolvedValue([
        {
          artwork: resolve(fixtures, 'cover.jpg'),
          provider: local.name
        }
      ])
      audiodb.findArtistArtwork.mockResolvedValue([])
      discogs.findArtistArtwork.mockResolvedValue([])
      const savedArtists = artists.map(artist => ({
        ...artist,
        media: resolve(os.tmpdir(), 'melodie-media', `${artist.id}.jpg`)
      }))

      const now = Date.now()
      mediaService.triggerAlbumsEnrichment(60)
      mediaService.triggerArtistsEnrichment(60)
      await sleep(1500)

      expect(local.findArtistArtwork).toHaveBeenCalledWith(artists[0].name)
      expect(local.findArtistArtwork).toHaveBeenCalledTimes(1)
      expect(audiodb.findArtistArtwork).not.toHaveBeenCalled()
      expect(discogs.findArtistArtwork).not.toHaveBeenCalled()
      expect(albumsModel.listMedialess).toHaveBeenCalledTimes(1)
      expect(albumsModel.listMedialess.mock.calls[0][0]).toBeWithin(
        now - dayMs,
        now - dayMs + 5
      )
      expect(artistsModel.listMedialess).toHaveBeenCalledTimes(1)
      expect(artistsModel.listMedialess.mock.calls[0][0]).toBeWithin(
        now - dayMs,
        now - dayMs + 5
      )
      expect(artistsModel.save).toHaveBeenCalledWith(savedArtists[0])
      expect(artistsModel.save).toHaveBeenCalledTimes(1)
      expect(albumsModel.save).not.toHaveBeenCalled()
      expect(tracksModel.save).not.toHaveBeenCalled()
      expect(broadcast).toHaveBeenCalledWith('artist-changes', [
        {
          ...savedArtists[0],
          media: null
        },
        savedArtists[0]
      ])
      expect(broadcast).toHaveBeenCalledTimes(1)
    })
  })

  describe('triggerArtistEnrichment', () => {
    beforeEach(async () => {
      electron.app.getPath.mockReturnValue(os.tmpdir())
      settingsModel.get.mockResolvedValue({ locale: 'en' })
      await fs.ensureDir(resolve(os.tmpdir(), 'melodie-media'))
    })

    it('saves first returned artwork', async () => {
      const artist = {
        id: faker.random.number({ min: 9999 }),
        name: faker.name.findName(),
        media: null,
        trackIds: []
      }
      const savedArtist = {
        ...artist,
        media: resolve(os.tmpdir(), 'melodie-media', `${artist.id}.jpeg`)
      }
      artistsModel.getById.mockResolvedValue(artist)
      artistsModel.save.mockResolvedValueOnce({ saved: [savedArtist] })
      local.findArtistArtwork.mockResolvedValueOnce([])
      audiodb.findArtistArtwork.mockResolvedValueOnce([
        {
          artwork:
            'https://www.theaudiodb.com/images/media/artist/thumb/uxrqxy1347913147.jpg',
          provider: audiodb.name
        }
      ])
      discogs.findArtistArtwork.mockResolvedValueOnce([])

      await mediaService.triggerArtistEnrichment(artist.id)

      await expect(
        fs.access(savedArtist.media, constants.R_OK)
      ).resolves.toBeNil()

      expect(local.findArtistArtwork).toHaveBeenCalledWith(artist.name)
      expect(local.findArtistArtwork).toHaveBeenCalledTimes(1)
      expect(audiodb.findArtistArtwork).toHaveBeenCalledWith(artist.name)
      expect(audiodb.findArtistArtwork).toHaveBeenCalledTimes(1)
      expect(discogs.findArtistArtwork).toHaveBeenCalledWith(artist.name)
      expect(discogs.findArtistArtwork).toHaveBeenCalledTimes(1)
      expect(artistsModel.save).toHaveBeenCalledWith(savedArtist)
      expect(artistsModel.save).toHaveBeenCalledTimes(1)
      expect(broadcast).toHaveBeenCalledWith('artist-changes', [
        {
          ...savedArtist,
          media: null
        },
        savedArtist
      ])
      expect(broadcast).toHaveBeenCalledTimes(1)
    })

    it('merges returned bios', async () => {
      const id = faker.random.number({ min: 9999 })
      const artist = {
        id,
        name: faker.name.findName(),
        media: resolve(os.tmpdir(), 'melodie-media', `${id}.jpeg`),
        trackIds: []
      }
      const bio1 = {
        en: `English 1 ${faker.lorem.words()}`
      }
      const bio2 = {
        en: `English 2 ${faker.lorem.words()}`,
        fr: `Français 2 ${faker.lorem.words()}`
      }
      const savedArtist = {
        ...artist,
        bio: {
          en: bio1.en,
          fr: bio2.fr
        }
      }
      artistsModel.getById.mockResolvedValue(artist)
      artistsModel.save.mockResolvedValueOnce({ saved: [savedArtist] })
      local.findArtistArtwork.mockResolvedValueOnce([])
      audiodb.findArtistArtwork.mockResolvedValueOnce([
        {
          bio: bio1,
          provider: audiodb.name
        }
      ])
      discogs.findArtistArtwork.mockResolvedValueOnce([
        {
          bio: bio2,
          provider: discogs.name
        }
      ])

      await mediaService.triggerArtistEnrichment(artist.id)

      expect(local.findArtistArtwork).toHaveBeenCalledWith(artist.name)
      expect(local.findArtistArtwork).toHaveBeenCalledTimes(1)
      expect(audiodb.findArtistArtwork).toHaveBeenCalledWith(artist.name)
      expect(audiodb.findArtistArtwork).toHaveBeenCalledTimes(1)
      expect(discogs.findArtistArtwork).toHaveBeenCalledWith(artist.name)
      expect(discogs.findArtistArtwork).toHaveBeenCalledTimes(1)
      expect(artistsModel.save).toHaveBeenCalledWith(savedArtist)
      expect(artistsModel.save).toHaveBeenCalledTimes(1)
      expect(broadcast).toHaveBeenCalledWith('artist-changes', [
        {
          ...savedArtist,
          media: null
        },
        savedArtist
      ])
      expect(broadcast).toHaveBeenCalledTimes(1)
    })

    it('saved both bio and artwork', async () => {
      const artist = {
        id: faker.random.number({ min: 9999 }),
        name: faker.name.findName(),
        media: null,
        trackIds: []
      }
      const bio = {
        en: `English ${faker.lorem.words()}`,
        fr: `Français ${faker.lorem.words()}`
      }
      const savedArtist = {
        ...artist,
        bio,
        media: resolve(os.tmpdir(), 'melodie-media', `${artist.id}.jpeg`)
      }
      artistsModel.getById.mockResolvedValue(artist)
      artistsModel.save.mockResolvedValueOnce({ saved: [savedArtist] })
      local.findArtistArtwork.mockResolvedValueOnce([])
      audiodb.findArtistArtwork.mockResolvedValueOnce([
        {
          artwork:
            'https://www.theaudiodb.com/images/media/artist/thumb/uxrqxy1347913147.jpg',
          bio,
          provider: audiodb.name
        }
      ])
      discogs.findArtistArtwork.mockResolvedValueOnce([])

      await mediaService.triggerArtistEnrichment(artist.id)

      await expect(
        fs.access(savedArtist.media, constants.R_OK)
      ).resolves.toBeNil()

      expect(local.findArtistArtwork).toHaveBeenCalledWith(artist.name)
      expect(local.findArtistArtwork).toHaveBeenCalledTimes(1)
      expect(audiodb.findArtistArtwork).toHaveBeenCalledWith(artist.name)
      expect(audiodb.findArtistArtwork).toHaveBeenCalledTimes(1)
      expect(discogs.findArtistArtwork).toHaveBeenCalledWith(artist.name)
      expect(discogs.findArtistArtwork).toHaveBeenCalledTimes(1)
      expect(artistsModel.save).toHaveBeenCalledWith(savedArtist)
      expect(artistsModel.save).toHaveBeenCalledTimes(1)
      expect(broadcast).toHaveBeenCalledWith('artist-changes', [
        {
          ...savedArtist,
          media: null
        },
        savedArtist
      ])
      expect(broadcast).toHaveBeenCalledTimes(1)
    })

    it('skips artist with no name', async () => {
      const artist = {
        id: faker.random.number({ min: 9999 }),
        name: null,
        media: null,
        trackIds: []
      }
      artistsModel.getById.mockResolvedValue(artist)
      local.findArtistArtwork.mockResolvedValue([])
      audiodb.findArtistArtwork.mockResolvedValue([])
      discogs.findArtistArtwork.mockResolvedValue([])

      await mediaService.triggerArtistEnrichment(artist.id)

      expect(local.findArtistArtwork).not.toHaveBeenCalled()
      expect(audiodb.findArtistArtwork).not.toHaveBeenCalled()
      expect(discogs.findArtistArtwork).not.toHaveBeenCalled()
      expect(artistsModel.save).not.toHaveBeenCalled()
      expect(broadcast).not.toHaveBeenCalled()
    })

    it('does not override existing media', async () => {
      const id = faker.random.number({ min: 9999 })
      const media = resolve(os.tmpdir(), 'melodie-media', `${id}.jpeg`)
      const bio = {
        en: `English ${faker.lorem.words()}`,
        fr: `Français ${faker.lorem.words()}`
      }

      const artist = {
        id,
        name: faker.name.findName(),
        media,
        trackIds: []
      }
      const savedArtist = {
        ...artist,
        bio,
        media
      }
      artistsModel.getById.mockResolvedValue(artist)
      artistsModel.save.mockResolvedValueOnce({ saved: [savedArtist] })
      local.findArtistArtwork.mockResolvedValue([
        { artwork: media, provider: 'local' }
      ])
      audiodb.findArtistArtwork.mockResolvedValue([
        {
          artwork:
            'https://www.theaudiodb.com/images/media/artist/thumb/uxrqxy1347913147.jpg',
          bio,
          provider: audiodb.name
        }
      ])
      discogs.findArtistArtwork.mockResolvedValue([])

      await mediaService.triggerArtistEnrichment(artist.id)

      // we expect the file not to exist, as it must not have been downloaded or copied
      await expect(
        fs.access(savedArtist.media, constants.R_OK)
      ).rejects.toThrow('ENOENT')

      expect(local.findArtistArtwork).toHaveBeenCalledWith(artist.name)
      expect(local.findArtistArtwork).toHaveBeenCalledTimes(1)
      expect(audiodb.findArtistArtwork).toHaveBeenCalledWith(artist.name)
      expect(audiodb.findArtistArtwork).toHaveBeenCalledTimes(1)
      expect(discogs.findArtistArtwork).toHaveBeenCalledWith(artist.name)
      expect(discogs.findArtistArtwork).toHaveBeenCalledTimes(1)
      expect(artistsModel.save).toHaveBeenCalledWith(savedArtist)
      expect(artistsModel.save).toHaveBeenCalledTimes(1)
      expect(broadcast).toHaveBeenCalledWith('artist-changes', [
        {
          ...savedArtist,
          media: null
        },
        savedArtist
      ])
      expect(broadcast).toHaveBeenCalledTimes(1)
    })

    it('stops on artist with artwork and bio for current locale', async () => {
      const id = faker.random.number({ min: 9999 })
      const artist = {
        id,
        name: faker.name.findName(),
        media: resolve(os.tmpdir(), 'melodie-media', `${id}.jpg`),
        bio: { en: faker.lorem.words() },
        trackIds: []
      }
      artistsModel.getById.mockResolvedValue(artist)

      await mediaService.triggerArtistEnrichment(id)

      expect(local.findArtistArtwork).not.toHaveBeenCalled()
      expect(audiodb.findArtistArtwork).not.toHaveBeenCalled()
      expect(discogs.findArtistArtwork).not.toHaveBeenCalled()
      expect(artistsModel.save).not.toHaveBeenCalled()
      expect(broadcast).not.toHaveBeenCalled()
    })

    it('stops on missing results', async () => {
      const id = faker.random.number({ min: 9999 })
      const artist = {
        id,
        name: faker.name.findName(),
        media: null,
        trackIds: []
      }
      artistsModel.getById.mockResolvedValue(artist)
      local.findArtistArtwork.mockResolvedValueOnce([])
      audiodb.findArtistArtwork.mockResolvedValueOnce([])
      discogs.findArtistArtwork.mockResolvedValueOnce([])

      await mediaService.triggerArtistEnrichment(id)

      expect(local.findArtistArtwork).toHaveBeenCalledWith(artist.name)
      expect(local.findArtistArtwork).toHaveBeenCalledTimes(1)
      expect(audiodb.findArtistArtwork).toHaveBeenCalledWith(artist.name)
      expect(audiodb.findArtistArtwork).toHaveBeenCalledTimes(1)
      expect(discogs.findArtistArtwork).toHaveBeenCalledWith(artist.name)
      expect(discogs.findArtistArtwork).toHaveBeenCalledTimes(1)
      expect(artistsModel.save).not.toHaveBeenCalled()
      expect(broadcast).not.toHaveBeenCalled()
    })

    it('stops on unknown artist', async () => {
      artistsModel.getById.mockResolvedValue(null)

      await mediaService.triggerArtistEnrichment(faker.random.number())

      expect(local.findArtistArtwork).not.toHaveBeenCalled()
      expect(audiodb.findArtistArtwork).not.toHaveBeenCalled()
      expect(discogs.findArtistArtwork).not.toHaveBeenCalled()
      expect(artistsModel.save).not.toHaveBeenCalled()
      expect(broadcast).not.toHaveBeenCalled()
    })
  })

  describe('triggerAlbumsEnrichment', () => {
    beforeEach(async () => {
      electron.app.getPath.mockReturnValue(os.tmpdir())
      await fs.ensureDir(resolve(os.tmpdir(), 'media'))
    })

    afterEach(() => mediaService.stopEnrichment())

    it('saves first returned cover for album', async () => {
      const tracks = [
        {
          id: faker.random.number({ min: 9999 }),
          path: resolve(os.tmpdir(), 'media', faker.system.fileName())
        },
        {
          id: faker.random.number({ min: 9999 }),
          path: resolve(os.tmpdir(), 'media', faker.system.fileName())
        }
      ]
      const albums = [
        {
          id: faker.random.number({ min: 9999 }),
          name: faker.commerce.productName(),
          media: null,
          trackIds: [tracks[0].id]
        },
        {
          id: faker.random.number({ min: 9999 }),
          name: faker.commerce.productName(),
          media: null,
          trackIds: [tracks[1].id]
        }
      ]
      const media = resolve(fixtures, 'cover.jpg')
      albumsModel.listMedialess.mockResolvedValueOnce(albums)
      albumsModel.getById.mockImplementation(async id =>
        albums.find(album => album.id === id)
      )
      albumsModel.save.mockImplementation(async album => ({
        saved: [album]
      }))
      tracksModel.getByIds.mockImplementation(async ids =>
        tracks.filter(({ id }) => ids.includes(id))
      )
      local.findAlbumCover.mockImplementation(async searched =>
        searched === albums[0].name
          ? [
              {
                cover: media,
                provider: local.name
              },
              {
                cover: resolve(fixtures, 'avatar.jpg'),
                provider: local.name
              }
            ]
          : []
      )
      audiodb.findAlbumCover.mockImplementation(async searched =>
        searched === albums[1].name
          ? [
              {
                cover:
                  'https://www.theaudiodb.com/images/media/album/thumb/swxywp1367234202.jpg',
                provider: audiodb.name
              }
            ]
          : []
      )
      discogs.findAlbumCover.mockResolvedValue([])
      const savedAlbums = albums.map(album => ({
        ...album,
        media: resolve(
          os.tmpdir(),
          'media',
          `cover.${album === albums[0] ? 'jpg' : 'jpeg'}`
        )
      }))
      const savedTracks = tracks.map(track => ({
        ...track,
        media: resolve(
          os.tmpdir(),
          'media',
          `cover.${track === tracks[0] ? 'jpg' : 'jpeg'}`
        )
      }))

      const now = Date.now()
      mediaService.triggerAlbumsEnrichment(6000)
      await sleep(1000)

      expect(await fs.access(savedAlbums[0].media, constants.R_OK))
      expect(await fs.readFile(savedAlbums[0].media, 'utf8')).toEqual(
        await fs.readFile(media, 'utf8')
      )

      expect(local.findAlbumCover).toHaveBeenCalledWith(albums[0].name)
      expect(local.findAlbumCover).toHaveBeenCalledWith(albums[1].name)
      expect(local.findAlbumCover).toHaveBeenCalledTimes(2)
      expect(audiodb.findAlbumCover).toHaveBeenCalledWith(albums[1].name)
      expect(audiodb.findAlbumCover).toHaveBeenCalledTimes(1)
      expect(discogs.findAlbumCover).not.toHaveBeenCalled()
      expect(albumsModel.listMedialess).toHaveBeenCalledTimes(1)
      expect(albumsModel.listMedialess.mock.calls[0][0]).toBeWithin(
        now - dayMs,
        now - dayMs + 5
      )
      expect(albumsModel.save).toHaveBeenNthCalledWith(1, savedAlbums[0])
      expect(albumsModel.save).toHaveBeenNthCalledWith(2, savedAlbums[1])
      expect(albumsModel.save).toHaveBeenCalledTimes(2)
      expect(tracksModel.save).toHaveBeenNthCalledWith(1, [savedTracks[0]])
      expect(tracksModel.save).toHaveBeenNthCalledWith(2, [savedTracks[1]])
      expect(tracksModel.save).toHaveBeenCalledTimes(2)
      expect(broadcast).toHaveBeenNthCalledWith(1, 'album-changes', [
        {
          ...savedAlbums[0],
          media: null
        },
        savedAlbums[0]
      ])
      expect(broadcast).toHaveBeenNthCalledWith(2, 'track-changes', [
        {
          ...savedTracks[0],
          media: null
        }
      ])
      expect(broadcast).toHaveBeenNthCalledWith(
        3,
        'track-changes',
        savedTracks.slice(0, 1)
      )
      expect(broadcast).toHaveBeenNthCalledWith(4, 'album-changes', [
        {
          ...savedAlbums[1],
          media: null
        },
        savedAlbums[1]
      ])
      expect(broadcast).toHaveBeenNthCalledWith(5, 'track-changes', [
        {
          ...savedTracks[1],
          media: null
        }
      ])
      expect(broadcast).toHaveBeenNthCalledWith(
        6,
        'track-changes',
        savedTracks.slice(1)
      )
      expect(broadcast).toHaveBeenCalledTimes(6)
    })

    it('skips albums with no names', async () => {
      const tracks = [
        {
          id: faker.random.number({ min: 9999 }),
          path: resolve(os.tmpdir(), 'media', faker.system.fileName())
        },
        {
          id: faker.random.number({ min: 9999 }),
          path: resolve(os.tmpdir(), 'media', faker.system.fileName())
        }
      ]
      const albums = [
        {
          id: faker.random.number({ min: 9999 }),
          name: null,
          media: null,
          trackIds: [tracks[0].id]
        },
        {
          id: faker.random.number({ min: 9999 }),
          name: faker.commerce.productName(),
          media: null,
          trackIds: [tracks[1].id]
        }
      ]
      albumsModel.listMedialess.mockResolvedValueOnce(albums)
      albumsModel.getById.mockImplementation(async id =>
        albums.find(album => album.id === id)
      )
      tracksModel.getByIds.mockImplementation(async ids =>
        tracks.filter(({ id }) => ids.includes(id))
      )
      local.findAlbumCover.mockResolvedValue([])
      audiodb.findAlbumCover.mockResolvedValue([])
      discogs.findAlbumCover.mockResolvedValue([])

      const now = Date.now()
      mediaService.triggerAlbumsEnrichment(6000)
      await sleep(1000)

      expect(local.findAlbumCover).toHaveBeenCalledWith(albums[1].name)
      expect(local.findAlbumCover).toHaveBeenCalledTimes(1)
      expect(audiodb.findAlbumCover).toHaveBeenCalledWith(albums[1].name)
      expect(audiodb.findAlbumCover).toHaveBeenCalledTimes(1)
      expect(discogs.findAlbumCover).toHaveBeenCalledWith(albums[1].name)
      expect(discogs.findAlbumCover).toHaveBeenCalledTimes(1)
      expect(albumsModel.listMedialess).toHaveBeenCalledTimes(1)
      expect(albumsModel.save).toHaveBeenCalledWith({
        ...albums[1],
        processedEpoch: now
      })
      expect(albumsModel.save).toHaveBeenCalledTimes(1)
      expect(broadcast).not.toHaveBeenCalled()
    })

    it('saves processing date on album with no cover', async () => {
      const album = {
        id: faker.random.number({ min: 9999 }),
        name: faker.commerce.productName(),
        media: null,
        trackIds: []
      }
      albumsModel.listMedialess.mockResolvedValueOnce([album])
      albumsModel.save.mockImplementation(async album => ({
        saved: [album]
      }))
      local.findAlbumCover.mockResolvedValue([])
      audiodb.findAlbumCover.mockResolvedValue([])
      discogs.findAlbumCover.mockResolvedValue([])

      const now = Date.now()
      mediaService.triggerAlbumsEnrichment(6000)
      await sleep(1000)

      expect(albumsModel.listMedialess).toHaveBeenCalledTimes(1)
      expect(albumsModel.listMedialess.mock.calls[0][0]).toBeWithin(
        now - dayMs,
        now - dayMs + 5
      )
      expect(albumsModel.save).toHaveBeenCalledWith({
        ...album,
        processedEpoch: now
      })
      expect(albumsModel.save).toHaveBeenCalledTimes(1)
      expect(tracksModel.save).not.toHaveBeenCalled()
      expect(broadcast).not.toHaveBeenCalled()
    })

    it('retries album with no cover but at least one restricted provided', async () => {
      const tracks = [
        {
          id: faker.random.number({ min: 9999 }),
          path: resolve(os.tmpdir(), 'media', faker.system.fileName())
        },
        {
          id: faker.random.number({ min: 9999 }),
          path: resolve(os.tmpdir(), 'media', faker.system.fileName())
        }
      ]
      const albums = [
        {
          id: faker.random.number({ min: 9999 }),
          name: faker.commerce.productName(),
          media: null,
          trackIds: [tracks[0].id]
        },
        {
          id: faker.random.number({ min: 9999 }),
          name: faker.commerce.productName(),
          media: null,
          trackIds: [tracks[1].id]
        }
      ]
      albumsModel.listMedialess.mockResolvedValueOnce(albums)
      albumsModel.getById.mockImplementation(async id =>
        albums.find(album => album.id === id)
      )
      albumsModel.save.mockImplementation(async album => ({
        saved: [album]
      }))
      tracksModel.getByIds.mockImplementation(async ids =>
        tracks.filter(({ id }) => ids.includes(id))
      )
      local.findAlbumCover.mockResolvedValue([])
      let i = 0
      audiodb.findAlbumCover.mockImplementation(async () => {
        if (++i <= 1) {
          throw new TooManyRequestsError()
        }
        return []
      })
      discogs.findAlbumCover.mockResolvedValue([])

      const now = Date.now()
      mediaService.triggerAlbumsEnrichment(6000)
      await sleep(1000)

      for (const provider of [local, audiodb, discogs]) {
        expect(provider.findAlbumCover).toHaveBeenNthCalledWith(
          1,
          albums[0].name
        )
        expect(provider.findAlbumCover).toHaveBeenNthCalledWith(
          2,
          albums[1].name
        )
        expect(provider.findAlbumCover).toHaveBeenNthCalledWith(
          3,
          albums[0].name
        )
        expect(provider.findAlbumCover).toHaveBeenCalledTimes(3)
      }
      expect(albumsModel.listMedialess).toHaveBeenCalledTimes(1)
      expect(albumsModel.listMedialess.mock.calls[0][0]).toBeWithin(
        now - dayMs,
        now - dayMs + 5
      )
      expect(albumsModel.save).toHaveBeenCalledWith({
        ...albums[0],
        processedEpoch: now
      })
      expect(albumsModel.save).toHaveBeenCalledWith({
        ...albums[1],
        processedEpoch: now
      })
      expect(albumsModel.save).toHaveBeenCalledTimes(2)
      expect(tracksModel.save).not.toHaveBeenCalled()
      expect(broadcast).not.toHaveBeenCalled()
    })

    it('does not process more than N albums per minute', async () => {
      const tracks = Array.from({ length: 5 }, () => ({
        id: faker.random.number({ min: 9999 }),
        path: resolve(os.tmpdir(), 'media', faker.system.fileName())
      }))
      const albums = Array.from({ length: 5 }, (v, i) => ({
        id: faker.random.number({ min: 9999 }),
        name: faker.commerce.productName(),
        media: null,
        trackIds: [tracks[i].id]
      }))
      albumsModel.listMedialess.mockResolvedValueOnce(albums)
      albumsModel.getById.mockImplementation(async id =>
        albums.find(album => album.id === id)
      )
      albumsModel.save.mockImplementation(async album => ({
        saved: [album]
      }))
      tracksModel.getByIds.mockImplementation(async ids =>
        tracks.filter(({ id }) => ids.includes(id))
      )
      local.findAlbumCover.mockResolvedValue([
        {
          cover: resolve(fixtures, 'cover.jpg'),
          provider: local.name
        }
      ])
      audiodb.findAlbumCover.mockResolvedValue([])
      discogs.findAlbumCover.mockResolvedValue([])
      const savedAlbums = albums.map(artist => ({
        ...artist,
        media: resolve(os.tmpdir(), 'media', 'cover.jpg')
      }))
      const savedTracks = tracks.map(track => ({
        ...track,
        media: resolve(os.tmpdir(), 'media', 'cover.jpg')
      }))

      const now = Date.now()
      mediaService.triggerAlbumsEnrichment(60)
      await sleep(1500)

      expect(local.findAlbumCover).toHaveBeenCalledWith(albums[0].name)
      expect(local.findAlbumCover).toHaveBeenCalledTimes(1)
      expect(audiodb.findAlbumCover).not.toHaveBeenCalled()
      expect(discogs.findAlbumCover).not.toHaveBeenCalled()
      expect(albumsModel.listMedialess).toHaveBeenCalledTimes(1)
      expect(albumsModel.listMedialess.mock.calls[0][0]).toBeWithin(
        now - dayMs,
        now - dayMs + 5
      )
      expect(albumsModel.save).toHaveBeenCalledWith(savedAlbums[0])
      expect(albumsModel.save).toHaveBeenCalledTimes(1)
      expect(tracksModel.save).toHaveBeenCalledWith([savedTracks[0]])
      expect(tracksModel.save).toHaveBeenCalledTimes(1)
      expect(broadcast).toHaveBeenNthCalledWith(1, 'album-changes', [
        {
          ...savedAlbums[0],
          media: null
        },
        savedAlbums[0]
      ])
      expect(broadcast).toHaveBeenNthCalledWith(2, 'track-changes', [
        {
          ...savedTracks[0],
          media: null
        }
      ])
      expect(broadcast).toHaveBeenNthCalledWith(
        3,
        'track-changes',
        savedTracks.slice(0, 1)
      )
      expect(broadcast).toHaveBeenCalledTimes(3)
    })

    it('stops previous enrichment', async () => {
      const artists = Array.from({ length: 5 }, () => ({
        id: faker.random.number({ min: 9999 }),
        name: faker.name.findName(),
        media: null,
        trackIds: []
      }))
      artistsModel.listMedialess.mockResolvedValue(artists)

      const tracks = Array.from({ length: 5 }, () => ({
        id: faker.random.number({ min: 9999 }),
        path: resolve(os.tmpdir(), 'media', faker.system.fileName())
      }))
      const albums = Array.from({ length: 5 }, (v, i) => ({
        id: faker.random.number({ min: 9999 }),
        name: faker.commerce.productName(),
        media: null,
        trackIds: [tracks[i].id]
      }))
      albumsModel.listMedialess.mockResolvedValueOnce(albums)
      albumsModel.getById.mockImplementation(async id =>
        albums.find(album => album.id === id)
      )
      albumsModel.save.mockImplementation(async album => ({
        saved: [album]
      }))
      tracksModel.getByIds.mockImplementation(async ids =>
        tracks.filter(({ id }) => ids.includes(id))
      )
      local.findAlbumCover.mockResolvedValue([
        {
          cover: resolve(fixtures, 'cover.jpg'),
          provider: local.name
        }
      ])
      audiodb.findAlbumCover.mockResolvedValue([])
      discogs.findAlbumCover.mockResolvedValue([])
      const savedAlbums = albums.map(artist => ({
        ...artist,
        media: resolve(os.tmpdir(), 'media', 'cover.jpg')
      }))
      const savedTracks = tracks.map(track => ({
        ...track,
        media: resolve(os.tmpdir(), 'media', 'cover.jpg')
      }))

      const now = Date.now()
      mediaService.triggerArtistsEnrichment(60)
      mediaService.triggerAlbumsEnrichment(60)
      await sleep(1500)

      expect(local.findAlbumCover).toHaveBeenCalledWith(albums[0].name)
      expect(local.findAlbumCover).toHaveBeenCalledTimes(1)
      expect(audiodb.findAlbumCover).not.toHaveBeenCalled()
      expect(discogs.findAlbumCover).not.toHaveBeenCalled()
      expect(albumsModel.listMedialess).toHaveBeenCalledTimes(1)
      expect(albumsModel.listMedialess.mock.calls[0][0]).toBeWithin(
        now - dayMs,
        now - dayMs + 5
      )
      expect(artistsModel.listMedialess).toHaveBeenCalledTimes(1)
      expect(artistsModel.listMedialess.mock.calls[0][0]).toBeWithin(
        now - dayMs,
        now - dayMs + 5
      )
      expect(artistsModel.save).not.toHaveBeenCalled()
      expect(albumsModel.save).toHaveBeenCalledWith(savedAlbums[0])
      expect(albumsModel.save).toHaveBeenCalledTimes(1)
      expect(tracksModel.save).toHaveBeenCalledWith([savedTracks[0]])
      expect(tracksModel.save).toHaveBeenCalledTimes(1)
      expect(broadcast).toHaveBeenNthCalledWith(1, 'album-changes', [
        {
          ...savedAlbums[0],
          media: null
        },
        savedAlbums[0]
      ])
      expect(broadcast).toHaveBeenNthCalledWith(2, 'track-changes', [
        {
          ...savedTracks[0],
          media: null
        }
      ])
      expect(broadcast).toHaveBeenNthCalledWith(
        3,
        'track-changes',
        savedTracks.slice(0, 1)
      )
      expect(broadcast).toHaveBeenCalledTimes(3)
    })
  })
})
