'use strict'

if (process.env.REAL_NETWORK) require('dotenv').config()
const nock = require('nock')
const provider = require('.')
const { withNockIt } = require('../../tests')

describe('AudioDB provider', () => {
  describe('findArtistArtwork()', () => {
    withNockIt('returns artwork', async () => {
      expect(await provider.findArtistArtwork('coldplay')).toEqual([
        {
          full:
            'https://www.theaudiodb.com/images/media/artist/thumb/uxrqxy1347913147.jpg',
          preview:
            'https://www.theaudiodb.com/images/media/artist/thumb/uxrqxy1347913147.jpg/preview'
        },
        {
          full:
            'https://www.theaudiodb.com/images/media/artist/fanart/spvryu1347980801.jpg',
          preview:
            'https://www.theaudiodb.com/images/media/artist/fanart/spvryu1347980801.jpg/preview'
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
    })
  })

  describe('findAlbumCover()', () => {
    withNockIt('returns cover', async () => {
      expect(await provider.findAlbumCover('Parachutes')).toEqual([
        {
          full:
            'https://www.theaudiodb.com/images/media/album/thumb/swxywp1367234202.jpg',
          preview:
            'https://www.theaudiodb.com/images/media/album/thumb/swxywp1367234202.jpg/preview'
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
    })
  })
})
