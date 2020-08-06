'use strict'

const nock = require('nock')
const { withNockIt } = require('../tests')
const engine = require('./artwork-finder')

describe('Artwork finder', () => {
  withNockIt('returns artist artwork from AudioDB', async () => {
    expect(await engine.findForArtist('coldplay')).toEqual([
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

  withNockIt('returns empty artist artwork from AudioDB', async () => {
    expect(await engine.findForArtist('lifeforms')).toEqual([])
  })

  withNockIt('returns unknown artist artwork from AudioDB', async () => {
    expect(await engine.findForArtist('loremipsum')).toEqual([])
  })

  describe(`given no network`, () => {
    beforeAll(() => {
      if (!nock.isActive()) {
        nock.activate()
      }
      nock.disableNetConnect()
    })

    afterAll(() => nock.restore())

    it('returns no artwork from AudioDB', async () => {
      expect(await engine.findForArtist('coldplay')).toEqual([])
    })
  })
})
