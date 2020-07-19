'use strict'

const faker = require('faker')
const knex = require('knex')
const fs = require('fs-extra')
const os = require('os')
const { join } = require('path')
const { tracksModel } = require('./tracks')
const { hash } = require('../utils')

jest.mock('electron', () => ({ app: { getAppPath: jest.fn() } }))

let dbFile
let db

describe('Tracks model', () => {
  const models = [
    {
      path: faker.system.fileName(),
      tags: JSON.stringify({})
    },
    {
      path: faker.system.fileName(),
      tags: JSON.stringify({
        artists: [faker.name.findName()],
        album: faker.commerce.productName()
      })
    },
    {
      path: faker.system.fileName(),
      tags: JSON.stringify({ artists: [faker.name.findName()] })
    },
    {
      path: faker.system.fileName(),
      tags: JSON.stringify({ artists: [], album: faker.commerce.productName() })
    }
  ].map(track => ({
    ...track,
    id: hash(track.path)
  }))

  beforeAll(async () => {
    dbFile = join(await fs.mkdtemp(join(os.tmpdir(), 'melodie-')), 'db.sqlite3')
    db = knex({
      client: 'sqlite3',
      useNullAsDefault: true,
      connection: { filename: dbFile }
    })
  })

  beforeEach(async () => {
    await tracksModel.init(dbFile)
    await db(tracksModel.name).insert(models)
  })

  afterEach(async () => {
    if (await db.schema.hasTable(tracksModel.name)) {
      await db.schema.dropTable(tracksModel.name)
    }
  })

  it('adds new track', async () => {
    const path = faker.system.fileName()
    const track = {
      id: hash(path),
      path,
      media: faker.image.image(),
      mtimeMs: Date.now(),
      tags: {
        album: faker.commerce.productName(),
        artists: [faker.name.findName(), faker.name.findName()]
      }
    }

    await tracksModel.save(track)
    expect(await tracksModel.getById(track.id)).toEqual(track)
  })

  it('returns old tags when saving existing track', async () => {
    const track = {
      ...models[1],
      media: faker.image.image(),
      mtimeMs: Date.now(),
      tags: {
        album: faker.commerce.productName(),
        artists: [faker.name.findName(), faker.name.findName()]
      }
    }

    const oldTags = await tracksModel.save(track)
    expect(await tracksModel.getById(track.id)).toEqual(track)
    expect(oldTags).toEqual([
      { id: track.id, tags: JSON.parse(models[1].tags) }
    ])
  })
})
