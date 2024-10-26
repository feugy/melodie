import { faker } from '@faker-js/faker'
import fs from 'fs-extra'
import os from 'os'
import { join } from 'path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { makeRef } from '../tests'
import { artistsModel } from './artists'
import { tracksModel } from './tracks'

describe('Artist model', () => {
  const album1 = faker.person.fullName()
  const album2 = faker.person.fullName()

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
      id: faker.number.int(),
      media: faker.image.url(),
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
      id: faker.number.int(),
      media: faker.image.url(),
      mediaCount: faker.number.int({ max: 10 }),
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
