'use strict'

if (process.env.REAL_NETWORK) require('dotenv').config()
const nock = require('nock')
const provider = require('.')
const TooManyRequestsError = require('../too-many-requests-error')
const { withNockIt } = require('../../tests')

describe('AudioDB provider', () => {
  beforeEach(() => {
    provider.lastReqEpoch = 0
  })

  describe('findArtistArtwork()', () => {
    withNockIt('returns artwork', async () => {
      expect(await provider.findArtistArtwork('coldplay')).toEqual([
        {
          full:
            'https://www.theaudiodb.com/images/media/artist/thumb/uxrqxy1347913147.jpg',
          provider: provider.name
        },
        {
          full:
            'https://www.theaudiodb.com/images/media/artist/fanart/spvryu1347980801.jpg',
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
            'https://www.theaudiodb.com/images/media/album/thumb/swxywp1367234202.jpg',
          provider: provider.name
        }
      ])
    })

    withNockIt('returns no cover for album without known image', async () => {
      expect(await provider.findAlbumCover('The Invisible Object')).toEqual([])
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
