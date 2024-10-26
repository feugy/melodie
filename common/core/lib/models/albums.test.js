import { faker } from '@faker-js/faker'
import fs from 'fs-extra'
import os from 'os'
import { join } from 'path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { makeRef } from '../tests'
import { albumsModel } from './albums'
import { tracksModel } from './tracks'

describe('Albums model', () => {
  const artist1 = faker.person.fullName()
  const artist2 = faker.person.fullName()

  // use fixed ids for consistent ordering
  const tracks = [
    {
      id: 1,
      tags: { artists: [artist1] }
    },
    {
      id: 2,
      tags: { artists: [artist1, artist2] }
    },
    {
      id: 3,
      tags: { artists: [artist2] }
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
    await albumsModel.init(dbFile)
    await tracksModel.init(dbFile)
    tracksModel.save(tracks)
  })

  afterAll(async () => {
    await albumsModel.constructor.release()
  })

  it('adds new album', async () => {
    const album = {
      id: faker.number.int(),
      media: faker.image.url(),
      processedEpoch: null,
      name: faker.commerce.productName(),
      trackIds: [tracks[0].id, tracks[3].id]
    }

    await albumsModel.save(album)
    expect((await albumsModel.list()).results).toEqual([
      {
        ...album,
        mediaCount: 1,
        refs: [makeRef(artist1), [1, null]]
      }
    ])
  })

  it('updates existing album with refs', async () => {
    const album = {
      id: faker.number.int(),
      media: faker.image.url(),
      mediaCount: faker.number.int({ max: 10 }),
      processedEpoch: null,
      name: faker.commerce.productName(),
      trackIds: [tracks[0].id, tracks[3].id]
    }

    expect((await albumsModel.save(album)).saved).toEqual([
      {
        ...album,
        refs: [makeRef(artist1), [1, null]]
      }
    ])

    album.removedTrackIds = album.trackIds.concat()
    album.trackIds = [tracks[1].id, tracks[2].id]

    const { saved } = await albumsModel.save(album)
    expect(saved).toEqual([
      {
        ...album,
        removedTrackIds: undefined,
        refs: [makeRef(artist1), makeRef(artist2)]
      }
    ])
    expect((await albumsModel.list()).results).toEqual(
      expect.arrayContaining(saved)
    )
  })

  describe('given some albums', () => {
    const name = faker.commerce.productName()

    const album1 = {
      id: faker.number.int(),
      media: faker.image.url(),
      mediaCount: 1,
      processedEpoch: null,
      name,
      trackIds: [tracks[0].id, tracks[3].id],
      refs: [makeRef(artist1), [1, null]]
    }
    const album2 = {
      id: faker.number.int(),
      media: faker.image.url(),
      mediaCount: 1,
      processedEpoch: null,
      name: faker.commerce.productName(),
      trackIds: [tracks[1].id],
      refs: [makeRef(artist1), makeRef(artist2)]
    }
    const album3 = {
      id: faker.number.int(),
      media: faker.image.url(),
      mediaCount: 1,
      processedEpoch: null,
      name,
      trackIds: [tracks[2].id],
      refs: [makeRef(artist2)]
    }

    beforeAll(async () => albumsModel.save([album1, album2, album3]))

    it('returns several albums by name', async () => {
      const results = await albumsModel.getByName(name)
      expect(results).toEqual(expect.arrayContaining([album1, album3]))
      expect(results).toHaveLength(2)
    })

    it('returns single album by name', async () => {
      expect(await albumsModel.getByName(album2.name)).toEqual([album2])
    })

    it('returns empty results on unknown name', async () => {
      expect(await albumsModel.getByName(faker.commerce.productName())).toEqual(
        []
      )
    })
  })
})
