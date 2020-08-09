'use strict'

if (process.env.REAL_NETWORK) require('dotenv').config()
const nock = require('nock')
const provider = require('.')
const { withNockIt } = require('../../tests')

describe('Discogs provider', () => {
  describe('findArtistArtwork()', () => {
    withNockIt('returns artwork', async () => {
      expect(await provider.findArtistArtwork('coldplay')).toEqual([
        {
          full:
            'https://img.discogs.com/RLkA5Qmo6_eNpWGjioaI4bJZUB4=/600x600/smart/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/A-29735-1591800654-2186.jpeg.jpg',
          preview:
            'https://img.discogs.com/wT8s4e2BCPOcCFoLhpw7PnsHLSs=/150x150/smart/filters:strip_icc():format(jpeg):mode_rgb():quality(40)/discogs-images/A-29735-1591800654-2186.jpeg.jpg',
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
    })
  })

  describe('findAlbumCover()', () => {
    withNockIt('returns cover', async () => {
      expect(await provider.findAlbumCover('Parachutes')).toEqual([
        {
          full:
            'https://img.discogs.com/eTfvDOHIvDIHuMFHv28H6_MG-b0=/fit-in/500x505/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/R-3069838-1466508617-4579.jpeg.jpg',
          preview:
            'https://img.discogs.com/2uuQhoo6sVjVcm_5dzdRVwanEYg=/fit-in/150x150/filters:strip_icc():format(jpeg):mode_rgb():quality(40)/discogs-images/R-3069838-1466508617-4579.jpeg.jpg',
          provider: provider.name
        },
        {
          full:
            'https://img.discogs.com/hp9V11cwfD4e4lWid6zV5j8P-g8=/fit-in/557x559/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/R-5589468-1397410589-8616.jpeg.jpg',
          preview:
            'https://img.discogs.com/767xqHjX9er5ybtwo_bz1UNxOHc=/fit-in/150x150/filters:strip_icc():format(jpeg):mode_rgb():quality(40)/discogs-images/R-5589468-1397410589-8616.jpeg.jpg',
          provider: provider.name
        },
        {
          full:
            'https://img.discogs.com/QpNOv7TPg9VIkdbCYKqEtNbCN04=/fit-in/600x595/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/R-2898241-1306263310.jpeg.jpg',
          preview:
            'https://img.discogs.com/ozha3Wu7e3rmGPo26SxWfEHEa5U=/fit-in/150x150/filters:strip_icc():format(jpeg):mode_rgb():quality(40)/discogs-images/R-2898241-1306263310.jpeg.jpg',
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
    })
  })
})
