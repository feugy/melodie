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
      trackIds: JSON.stringify([])
    },
    {
      id: faker.random.number(),
      name: faker.name.findName(),
      trackIds: JSON.stringify([faker.random.number()])
    },
    {
      id: faker.random.number(),
      name: faker.name.findName(),
      trackIds: JSON.stringify([faker.random.number(), faker.random.number()])
    },
    {
      id: faker.random.number(),
      name: faker.name.findName(),
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
    for (const model of models) {
      expect(await db(modelName).where({ id: model.id })).toEqual([
        {
          ...model,
          trackIds: JSON.stringify(model.trackIds)
        }
      ])
    }
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

  it('can serialize and deserialize undefined values for json attributes', async () => {
    const model = {
      id: faker.random.number(),
      name: faker.name.findName()
    }
    await tested.save(model)
    expect(await db(modelName).where({ id: model.id })).toEqual([
      {
        ...model,
        trackIds: 'null'
      }
    ])
    expect(await tested.getById(model.id)).toEqual({
      ...model,
      trackIds: null
    })
  })
})
