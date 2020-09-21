'use strict'

if (process.env.REAL_NETWORK) require('dotenv').config()
const nock = require('nock')
const provider = require('.')
const TooManyRequestsError = require('../too-many-requests-error')
const { withNockIt } = require('../../tests')

describe('Discogs provider', () => {
  beforeEach(() => {
    provider.lastReqEpoch = 0
  })

  describe('findArtistArtwork()', () => {
    withNockIt('returns artwork', async () => {
      expect(await provider.findArtistArtwork('coldplay')).toEqual([
        {
          full:
            'https://img.discogs.com/RLkA5Qmo6_eNpWGjioaI4bJZUB4=/600x600/smart/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/A-29735-1591800654-2186.jpeg.jpg',
          provider: provider.name
        }
      ])
    })

    withNockIt(
      'returns no artwork for artist without known image',
      async () => {
        expect(await provider.findArtistArtwork('katie lombardi')).toEqual([])
      }
    )

    withNockIt('returns no artwork for unknown artist', async () => {
      expect(await provider.findArtistArtwork('loremipsum')).toEqual([])
    })

    describe(`given no network`, () => {
      beforeAll(() => {
        if (!nock.isActive()) {
          nock.activate()
        }
        nock.disableNetConnect()
      })

      afterAll(() => nock.restore())

      it('returns no artwork', async () => {
        expect(await provider.findArtistArtwork('coldplay')).toEqual([])
      })

      it('throws error when calling too frequently', async () => {
        expect(
          Promise.all(
            Array.from({ length: 50 }, () =>
              provider.findArtistArtwork('loremipsum')
            )
          )
        ).rejects.toThrow(TooManyRequestsError)
      })
    })
  })

  describe('findAlbumCover()', () => {
    withNockIt('returns cover', async () => {
      expect(await provider.findAlbumCover('Parachutes')).toEqual([
        {
          full:
            'https://img.discogs.com/QpNOv7TPg9VIkdbCYKqEtNbCN04=/fit-in/600x595/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/R-2898241-1306263310.jpeg.jpg',
          provider: provider.name
        },
        {
          full:
            'https://img.discogs.com/LXxOjvGFYExbXFWSPgkfdqqe33M=/fit-in/600x579/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/R-3673614-1458060187-6793.jpeg.jpg',
          provider: provider.name
        },
        {
          full:
            'https://img.discogs.com/816D9KU4HziOUuokH-SDgVzK9fI=/fit-in/400x399/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/R-512653-1277759045.jpeg.jpg',
          provider: provider.name
        }
      ])
    })

    withNockIt('returns no cover for album without known image', async () => {
      expect(
        await provider.findAlbumCover(
          `Etude Methodique Du Chant A L'Usage Des Maternelles Et Des Classes Primaires`
        )
      ).toEqual([])
    })

    withNockIt('returns no cover for unknown artist', async () => {
      expect(await provider.findAlbumCover('loremipsum')).toEqual([])
    })

    describe(`given no network`, () => {
      beforeAll(() => {
        if (!nock.isActive()) {
          nock.activate()
        }
        nock.disableNetConnect()
      })

      afterAll(() => nock.restore())

      it('returns no cover', async () => {
        expect(await provider.findAlbumCover('Parachutes')).toEqual([])
      })

      it('throws error when calling too frequently', async () => {
        expect(
          Promise.all(
            Array.from({ length: 50 }, () =>
              provider.findAlbumCover('loremipsum')
            )
          )
        ).rejects.toThrow(TooManyRequestsError)
      })
    })
  })
})
