'use strict'

const faker = require('faker')
const knex = require('knex')
const os = require('os')
const fs = require('fs-extra')
const { join } = require('path')
const { cloneDeep } = require('lodash')
const TrackList = require('./abstract-track-list')

const modelName = 'test'

class Test extends TrackList {
  constructor() {
    super(modelName, table => {
      table.integer('id').primary()
      table.string('name')
      table.string('media')
    })
  }
}

let dbFile
let db

describe('Abstract track list', () => {
  const tested = new Test()
  const models = [
    {
      id: faker.random.number(),
      name: faker.name.findName(),
      media: null,
      trackIds: JSON.stringify([])
    },
    {
      id: faker.random.number(),
      name: faker.name.findName(),
      media: faker.image.image(),
      trackIds: JSON.stringify([faker.random.number()])
    },
    {
      id: faker.random.number(),
      name: faker.name.findName(),
      media: null,
      trackIds: JSON.stringify([faker.random.number(), faker.random.number()])
    },
    {
      id: faker.random.number(),
      name: faker.name.findName(),
      media: null,
      trackIds: JSON.stringify([])
    }
  ]

  beforeAll(async () => {
    dbFile = join(await fs.mkdtemp(join(os.tmpdir(), 'melodie-')), 'db.sqlite3')
    db = knex({
      client: 'sqlite3',
      useNullAsDefault: true,
      connection: { filename: dbFile }
    })
  })

  beforeEach(async () => {
    await tested.init(dbFile)
    await db(modelName).insert(models)
  })

  afterEach(async () => {
    if (await db.schema.hasTable(modelName)) {
      await db.schema.dropTable(modelName)
    }
  })

  it('adds new model', async () => {
    const model = {
      id: faker.random.number(),
      name: faker.name.findName(),
      trackIds: [faker.random.number()]
    }
    await tested.save(model)
    expect(await db(modelName).where({ id: model.id })).toEqual([
      {
        ...model,
        media: null,
        trackIds: JSON.stringify(model.trackIds)
      }
    ])
  })

  it('saves multipe models', async () => {
    const models = [
      {
        id: faker.random.number(),
        name: faker.name.findName(),
        trackIds: [faker.random.number()]
      },
      {
        id: faker.random.number(),
        name: faker.name.findName(),
        trackIds: [faker.random.number()]
      }
    ]
    await tested.save(models)
    expect(await db(modelName).where({ id: models[0].id })).toEqual([
      {
        ...models[0],
        media: null,
        trackIds: JSON.stringify(models[0].trackIds)
      }
    ])
    expect(await db(modelName).where({ id: models[1].id })).toEqual([
      {
        ...models[1],
        media: null,
        trackIds: JSON.stringify(models[1].trackIds)
      }
    ])
  })

  it('updates multipe models with sparse data', async () => {
    const saved = [
      {
        id: models[0].id,
        name: models[0].name,
        media: faker.image.image(),
        trackIds: [faker.random.number()]
      },
      {
        id: models[1].id,
        name: models[1].name,
        removedTrackIds: [faker.random.number()]
      }
    ]
    await tested.save(saved)
    expect(await db(modelName).where({ id: models[0].id })).toEqual([
      {
        ...models[0],
        media: saved[0].media,
        trackIds: JSON.stringify(
          JSON.parse(models[0].trackIds).concat(saved[0].trackIds)
        )
      }
    ])
    expect(await db(modelName).where({ id: models[1].id })).toEqual([
      {
        ...models[1],
        trackIds: JSON.stringify(JSON.parse(models[1].trackIds))
      }
    ])
  })

  it('updates existing model and appends track ids', async () => {
    const model = cloneDeep(models[1])
    model.trackIds = [faker.random.number(), faker.random.number()]
    await tested.save(model)
    expect(await db(modelName).where({ id: model.id })).toEqual([
      {
        ...model,
        trackIds: JSON.stringify(
          JSON.parse(models[1].trackIds).concat(model.trackIds)
        )
      }
    ])
  })

  it('updates existing model and removes track ids', async () => {
    const model = cloneDeep(models[2])
    model.removedTrackIds = JSON.parse(model.trackIds).slice(1, 2)
    model.trackIds = [faker.random.number()]
    await tested.save(model)
    expect(await db(modelName).where({ id: model.id })).toEqual([
      {
        ...model,
        removedTrackIds: undefined,
        trackIds: JSON.stringify([
          JSON.parse(models[2].trackIds)[0],
          model.trackIds[0]
        ])
      }
    ])
  })

  it('updates existing and removes duplicates', async () => {
    const model = {
      ...models[2],
      trackIds: JSON.parse(models[2].trackIds)
    }
    await tested.save(model)
    expect(await db(modelName).where({ id: model.id })).toEqual([
      {
        ...model,
        trackIds: JSON.stringify(model.trackIds)
      }
    ])
  })

  it('deletes models which track ids are empty', async () => {
    const model = {
      id: models[1].id,
      removedTrackIds: JSON.parse(models[1].trackIds)
    }
    await tested.save(model)
    expect(await db(modelName).where({ id: model.id })).toEqual([])
  })
})
