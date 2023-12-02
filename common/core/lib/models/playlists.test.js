import { faker } from '@faker-js/faker'
import fs from 'fs-extra'
import os from 'os'
import { join } from 'path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { makeRef } from '../tests'
import { playlistsModel } from './playlists'
import { tracksModel } from './tracks'

describe('Playlists model', () => {
  const artist1 = faker.person.fullName()
  const artist2 = faker.person.fullName()
  const album1 = faker.commerce.productName()
  const album2 = faker.commerce.productName()

  // use fixed ids for consistent ordering
  const tracks = [
    {
      id: 1,
      tags: { artists: [artist1], album: album1 }
    },
    {
      id: 2,
      tags: { artists: [artist1, artist2], album: album2 }
    },
    {
      id: 3,
      tags: { artists: [artist2], album: album1 }
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
    await playlistsModel.init(dbFile)
    await tracksModel.init(dbFile)
    tracksModel.save(tracks)
  })

  afterAll(async () => {
    await playlistsModel.constructor.release()
  })

  it('adds new playlist', async () => {
    const playlist = {
      id: faker.number.int(),
      media: faker.image.url(),
      processedEpoch: null,
      name: faker.lorem.words(),
      desc: faker.lorem.paragraph(),
      trackIds: [tracks[0].id, tracks[3].id]
    }

    await playlistsModel.save(playlist)
    expect((await playlistsModel.list()).results).toEqual([
      {
        ...playlist,
        mediaCount: 1,
        refs: [makeRef(artist1), makeRef(album1), [1, null]]
      }
    ])
  })

  it('updates existing playlist with refs and overrides trackIds', async () => {
    const playlist = {
      id: faker.number.int(),
      media: faker.image.url(),
      mediaCount: faker.number.int({ max: 10 }),
      processedEpoch: null,
      name: faker.lorem.words(),
      desc: faker.lorem.paragraph(),
      trackIds: [tracks[0].id, tracks[3].id]
    }

    expect((await playlistsModel.save(playlist)).saved).toEqual([
      {
        ...playlist,
        refs: [makeRef(artist1), makeRef(album1), [1, null]]
      }
    ])

    playlist.trackIds = [tracks[1].id, tracks[2].id]

    const { saved } = await playlistsModel.save(playlist)
    expect(saved).toEqual([
      {
        ...playlist,
        refs: [
          makeRef(artist1),
          makeRef(artist2),
          makeRef(album2),
          makeRef(album1)
        ]
      }
    ])

    expect((await playlistsModel.list()).results).toEqual(
      expect.arrayContaining(saved)
    )
  })
})
