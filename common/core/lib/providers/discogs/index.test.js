import 'dotenv/config'

import nock from 'nock'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { withNockIt } from '../../tests'
import TooManyRequestsError from '../too-many-requests-error'
import provider from '.'

describe('Discogs provider', () => {
  beforeEach(() => {
    provider.lastReqEpoch = 0
    provider.init({
      token: process.env.REAL_NETWORK ? process.env.DISCOGS_TOKEN : 'TOKEN'
    })
  })

  describe('findArtistArtwork()', () => {
    it('returns nothing when not initialized', async () => {
      provider.init()
      expect(await provider.findArtistArtwork('coldplay')).toEqual([])
    })

    withNockIt('returns artwork', async () => {
      expect(await provider.findArtistArtwork('coldplay')).toEqual([
        {
          artwork:
            'https://img.discogs.com/RLkA5Qmo6_eNpWGjioaI4bJZUB4=/600x600/smart/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/A-29735-1591800654-2186.jpeg.jpg',
          bio: {
            en: "Coldplay is an English rock band from London, England. They've been a band since January 16, 1998 when they lost a demotape competition on XFM in London. Philip Christopher Harvey is the band's manager.\r\n\r\n[b][u]Line-up:[/u][/b]\r\nJonny Buckland (Jonathan Mark Buckland) - Guitar\r\nWill Champion (William Champion) - Drums\r\nGuy Berryman (Guy Rupert Berryman) - Bass\r\nChris Martin (Christopher Anthony John Martin) - Vocals"
          },
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
        await expect(
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
    it('returns nothing when not initialized', async () => {
      provider.init()
      expect(await provider.findAlbumCover('Parachutes')).toEqual([])
    })

    withNockIt('returns cover', async () => {
      expect(await provider.findAlbumCover('Parachutes')).toEqual([
        {
          cover:
            'https://img.discogs.com/MOShX8l25aDTILF-5Xk8cPm2B0s=/fit-in/600x596/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/R-2317835-1276526391.jpeg.jpg',
          provider: provider.name
        },
        {
          cover:
            'https://img.discogs.com/QpNOv7TPg9VIkdbCYKqEtNbCN04=/fit-in/600x595/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/R-2898241-1306263310.jpeg.jpg',
          provider: provider.name
        },
        {
          cover:
            'https://img.discogs.com/LXxOjvGFYExbXFWSPgkfdqqe33M=/fit-in/600x579/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/R-3673614-1458060187-6793.jpeg.jpg',
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
        await expect(
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
