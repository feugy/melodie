'use strict'

const faker = require('faker')
const fs = require('fs-extra')
const os = require('os')
const { join } = require('path')
const { artistsModel } = require('./artists')
const { tracksModel } = require('./tracks')
const { makeRef } = require('../tests')

describe('Artist model', () => {
  const album1 = faker.name.findName()
  const album2 = faker.name.findName()

  // use fixed ids for consistent ordering
  const tracks = [
    {
      id: 1,
      tags: { album: album1 }
    },
    {
      id: 2,
      tags: { album: album1 }
    },
    {
      id: 3,
      tags: { album: album2 }
    },
    {
      id: 4,
      tags: {}
    }
  ]

  beforeAll(async () => {
    const dbFile = join(
      await fs.mkdtemp(join(os.tmpdir(), 'melodie-')),
      'db.sqlite3'
    )
    await artistsModel.init(dbFile)
    await tracksModel.init(dbFile)
    tracksModel.save(tracks)
  })

  afterAll(async () => {
    await artistsModel.constructor.release()
  })

  it('adds new artist with refs', async () => {
    const artist = {
      id: faker.random.number(),
      media: faker.image.image(),
      processedEpoch: null,
      name: faker.commerce.productName(),
      trackIds: [tracks[0].id, tracks[3].id],
      bio: null
    }

    await artistsModel.save(artist)
    expect((await artistsModel.list()).results).toEqual([
      {
        ...artist,
        mediaCount: 1,
        refs: [makeRef(album1), [1, null]]
      }
    ])
  })

  it('updates existing artist with refs', async () => {
    const artist = {
      id: faker.random.number(),
      media: faker.image.image(),
      mediaCount: faker.random.number({ max: 10 }),
      processedEpoch: null,
      name: faker.commerce.productName(),
      trackIds: [tracks[0].id, tracks[3].id],
      bio: { en: faker.lorem.words() }
    }

    expect((await artistsModel.save(artist)).saved).toEqual([
      {
        ...artist,
        refs: [makeRef(album1), [1, null]]
      }
    ])

    artist.removedTrackIds = artist.trackIds.concat()
    artist.trackIds = [tracks[1].id, tracks[2].id]

    const { saved } = await artistsModel.save(artist)
    expect(saved).toEqual([
      {
        ...artist,
        removedTrackIds: undefined,
        refs: [makeRef(album1), makeRef(album2)]
      }
    ])
    expect((await artistsModel.list()).results).toEqual(
      expect.arrayContaining(saved)
    )
  })
})
