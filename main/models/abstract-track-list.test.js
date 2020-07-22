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
    await Test.release()
  })

  afterAll(async () => {
    await db.context.destroy()
  })

  describe('save', () => {
    it('adds new model', async () => {
      const model = {
        id: faker.random.number(),
        name: faker.name.findName(),
        trackIds: [faker.random.number()]
      }

      const { saved, removedIds } = await tested.save(model)

      const savedModel = { ...model, media: null }

      expect(saved).toEqual([savedModel])
      expect(removedIds).toEqual([])
      expect(await db(modelName).where({ id: model.id })).toEqual([
        {
          ...savedModel,
          trackIds: JSON.stringify(savedModel.trackIds)
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

      const { saved, removedIds } = await tested.save(models)

      const savedModels = [
        {
          ...models[0],
          media: null
        },
        {
          ...models[1],
          media: null
        }
      ]

      expect(saved).toEqual(savedModels)
      expect(removedIds).toEqual([])
      expect(await db(modelName).where({ id: models[0].id })).toEqual([
        {
          ...savedModels[0],
          trackIds: JSON.stringify(savedModels[0].trackIds)
        }
      ])
      expect(await db(modelName).where({ id: models[1].id })).toEqual([
        {
          ...savedModels[1],
          trackIds: JSON.stringify(savedModels[1].trackIds)
        }
      ])
    })

    it('updates multipe models with sparse data', async () => {
      const originals = [
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

      const { saved, removedIds } = await tested.save(originals)

      const savedModels = [
        {
          ...originals[0],
          trackIds: JSON.parse(models[0].trackIds).concat(originals[0].trackIds)
        },
        {
          ...models[1],
          trackIds: JSON.parse(models[1].trackIds)
        }
      ]

      expect(saved).toEqual(savedModels)
      expect(removedIds).toEqual([])
      expect(await db(modelName).where({ id: models[0].id })).toEqual([
        {
          ...savedModels[0],
          trackIds: JSON.stringify(savedModels[0].trackIds)
        }
      ])
      expect(await db(modelName).where({ id: models[1].id })).toEqual([
        {
          ...savedModels[1],
          trackIds: JSON.stringify(savedModels[1].trackIds)
        }
      ])
    })

    it('updates existing model and appends track ids', async () => {
      const model = cloneDeep(models[1])
      model.trackIds = [faker.random.number(), faker.random.number()]

      const { saved, removedIds } = await tested.save(model)

      const savedModel = {
        ...model,
        trackIds: JSON.parse(models[1].trackIds).concat(model.trackIds)
      }

      expect(saved).toEqual([savedModel])
      expect(removedIds).toEqual([])
      expect(await db(modelName).where({ id: model.id })).toEqual([
        {
          ...savedModel,
          trackIds: JSON.stringify(savedModel.trackIds)
        }
      ])
    })

    it('updates existing model and removes track ids', async () => {
      const model = cloneDeep(models[2])
      model.removedTrackIds = JSON.parse(model.trackIds).slice(1, 2)
      model.trackIds = [faker.random.number()]

      const { saved, removedIds } = await tested.save(model)

      const savedModel = {
        ...model,
        removedTrackIds: undefined,
        trackIds: [JSON.parse(models[2].trackIds)[0], model.trackIds[0]]
      }

      expect(saved).toEqual([savedModel])
      expect(removedIds).toEqual([])
      expect(await db(modelName).where({ id: model.id })).toEqual([
        {
          ...savedModel,
          trackIds: JSON.stringify(savedModel.trackIds)
        }
      ])
    })

    it('updates existing and removes duplicates', async () => {
      const model = {
        ...models[2],
        trackIds: JSON.parse(models[2].trackIds)
      }

      const { saved, removedIds } = await tested.save(model)

      expect(saved).toEqual([model])
      expect(removedIds).toEqual([])
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

      const { saved, removedIds } = await tested.save(model)

      expect(saved).toEqual([])
      expect(removedIds).toEqual([models[1].id])
      expect(await db(modelName).where({ id: model.id })).toEqual([])
    })
  })
})
