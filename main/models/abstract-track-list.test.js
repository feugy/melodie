'use strict'

const faker = require('faker')
const knex = require('knex')
const os = require('os')
const fs = require('fs-extra')
const { join } = require('path')
const merge = require('deepmerge')
const TrackList = require('./abstract-track-list')
const { dayMs } = require('../utils')

const modelName = 'test'

const computeRefs = jest.fn()

class Test extends TrackList {
  constructor() {
    super({ name: modelName })
  }

  async computeRefs(trx, trackIds) {
    return computeRefs(trackIds)
  }
}

let dbFile
let db

describe('Abstract track list', () => {
  const tested = new Test()
  const lastProcessed = Date.now() - dayMs
  const models = [
    {
      id: faker.random.number(),
      name: faker.name.findName(),
      media: null,
      trackIds: JSON.stringify([]),
      refs: JSON.stringify([[faker.random.number(), faker.name.findName()]]),
      processedEpoch: null
    },
    {
      id: faker.random.number(),
      name: faker.name.findName(),
      media: faker.image.image(),
      trackIds: JSON.stringify([faker.random.number()]),
      refs: JSON.stringify([
        [faker.random.number(), faker.name.findName()],
        [faker.random.number(), faker.name.findName()]
      ])
    },
    {
      id: faker.random.number(),
      name: faker.name.findName(),
      media: faker.image.image(),
      trackIds: JSON.stringify([faker.random.number(), faker.random.number()]),
      refs: JSON.stringify([
        [faker.random.number(), faker.name.findName()],
        [faker.random.number(), faker.name.findName()]
      ])
    },
    {
      id: faker.random.number(),
      name: faker.name.findName(),
      media: null,
      trackIds: JSON.stringify([]),
      refs: JSON.stringify([]),
      processedEpoch: lastProcessed
    }
  ]

  beforeAll(async () => {
    dbFile = join(await fs.mkdtemp(join(os.tmpdir(), 'melodie-')), 'db.sqlite3')
    db = knex({
      client: 'sqlite3',
      useNullAsDefault: true,
      connection: { filename: dbFile }
    })
    await tested.init(dbFile)
    await db.schema.createTable(modelName, table => {
      table.integer('id').primary()
      table.string('name')
      table.string('media')
      table.integer('processedEpoch')
      table.json('trackIds')
      table.json('refs')
    })
  })

  beforeEach(async () => {
    jest.resetAllMocks()
    await tested.reset()
    await db(modelName).insert(models)
  })

  afterAll(async () => {
    if (await db.schema.hasTable(modelName)) {
      await db.schema.dropTable(modelName)
    }
    await Test.release()
    await db.context.destroy()
  })

  describe('listMedialess', () => {
    it('does not return models with media', async () => {
      expect(await tested.listMedialess(Date.now())).toEqual(
        [models[0], models[3]]
          .map(model => ({
            processedEpoch: null,
            ...model,
            trackIds: JSON.parse(model.trackIds),
            refs: JSON.parse(model.refs)
          }))
          .sort((a, b) => (a.name < b.name ? -1 : 1))
      )
    })

    it('does not return models younger than given date', async () => {
      expect(await tested.listMedialess(Date.now() - 2 * dayMs)).toEqual([
        {
          ...models[0],
          processedEpoch: null,
          trackIds: JSON.parse(models[0].trackIds),
          refs: JSON.parse(models[0].refs)
        }
      ])
    })
  })

  describe('save', () => {
    it('adds new model', async () => {
      const refs = [[faker.random.number(), faker.name.findName()]]
      computeRefs.mockResolvedValueOnce(refs)
      const model = {
        id: faker.random.number(),
        name: faker.name.findName(),
        trackIds: [faker.random.number()]
      }

      const { saved, removedIds } = await tested.save(model)

      const savedModel = { ...model, media: null, processedEpoch: null, refs }

      expect(saved).toEqual([savedModel])
      expect(removedIds).toEqual([])
      expect(await db(modelName).where({ id: model.id })).toEqual([
        {
          ...savedModel,
          trackIds: JSON.stringify(savedModel.trackIds),
          refs: JSON.stringify(savedModel.refs)
        }
      ])
      expect(computeRefs).toHaveBeenCalledWith(model.trackIds)
      expect(computeRefs).toHaveBeenCalledTimes(1)
    })

    it('saves multipe models', async () => {
      const refs1 = [[faker.random.number(), faker.name.findName()]]
      const refs2 = [[faker.random.number(), faker.name.findName()]]
      computeRefs.mockResolvedValueOnce(refs1).mockResolvedValueOnce(refs2)
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
          processedEpoch: null,
          media: null,
          refs: refs1
        },
        {
          ...models[1],
          processedEpoch: null,
          media: null,
          refs: refs2
        }
      ]

      expect(saved).toEqual(savedModels)
      expect(removedIds).toEqual([])
      expect(await db(modelName).where({ id: models[0].id })).toEqual([
        {
          ...savedModels[0],
          trackIds: JSON.stringify(savedModels[0].trackIds),
          refs: JSON.stringify(savedModels[0].refs)
        }
      ])
      expect(await db(modelName).where({ id: models[1].id })).toEqual([
        {
          ...savedModels[1],
          trackIds: JSON.stringify(savedModels[1].trackIds),
          refs: JSON.stringify(savedModels[1].refs)
        }
      ])
      expect(computeRefs).toHaveBeenCalledWith(models[0].trackIds)
      expect(computeRefs).toHaveBeenCalledWith(models[1].trackIds)
      expect(computeRefs).toHaveBeenCalledTimes(2)
    })

    it('updates multipe models with sparse data', async () => {
      const refs = [[faker.random.number(), faker.name.findName()]]
      computeRefs.mockResolvedValue(refs)
      const originals = [
        {
          id: models[0].id,
          name: models[0].name,
          media: faker.image.image(),
          processedEpoch: null,
          trackIds: [faker.random.number()]
        },
        {
          id: models[1].id,
          name: models[1].name,
          removedTrackIds: [faker.random.number()]
        },
        {
          id: faker.random.number(),
          name: faker.name.findName(),
          trackIds: [faker.random.number()]
        }
      ]

      const { saved, removedIds } = await tested.save(originals)

      const savedModels = [
        {
          ...originals[0],
          trackIds: JSON.parse(models[0].trackIds).concat(
            originals[0].trackIds
          ),
          refs
        },
        {
          ...models[1],
          processedEpoch: null,
          trackIds: JSON.parse(models[1].trackIds),
          refs
        },
        {
          ...originals[2],
          processedEpoch: null,
          media: null,
          refs
        }
      ]

      expect(saved).toEqual(savedModels)
      expect(removedIds).toEqual([])
      expect(await db(modelName).where({ id: savedModels[0].id })).toEqual([
        {
          ...savedModels[0],
          trackIds: JSON.stringify(savedModels[0].trackIds),
          refs: JSON.stringify(savedModels[0].refs)
        }
      ])
      expect(await db(modelName).where({ id: savedModels[1].id })).toEqual([
        {
          ...savedModels[1],
          trackIds: JSON.stringify(savedModels[1].trackIds),
          refs: JSON.stringify(savedModels[1].refs)
        }
      ])
      expect(await db(modelName).where({ id: savedModels[2].id })).toEqual([
        {
          ...savedModels[2],
          trackIds: JSON.stringify(savedModels[2].trackIds),
          refs: JSON.stringify(savedModels[2].refs)
        }
      ])
      expect(computeRefs).toHaveBeenCalledWith(savedModels[0].trackIds)
      expect(computeRefs).toHaveBeenCalledWith(savedModels[1].trackIds)
      expect(computeRefs).toHaveBeenCalledWith(savedModels[2].trackIds)
      expect(computeRefs).toHaveBeenCalledTimes(3)
    })

    it('updates existing model and appends track ids and refs', async () => {
      const model = merge(models[1], {})
      model.trackIds = [faker.random.number(), faker.random.number()]
      delete model.refs
      const refs = [
        [faker.random.number(), faker.name.findName()],
        [faker.random.number(), faker.name.findName()]
      ]
      computeRefs.mockResolvedValueOnce(refs)

      const { saved, removedIds } = await tested.save(model)

      const savedModel = {
        ...model,
        processedEpoch: null,
        trackIds: JSON.parse(models[1].trackIds).concat(model.trackIds),
        refs
      }

      expect(saved).toEqual([savedModel])
      expect(removedIds).toEqual([])
      expect(await db(modelName).where({ id: model.id })).toEqual([
        {
          ...savedModel,
          trackIds: JSON.stringify(savedModel.trackIds),
          refs: JSON.stringify(savedModel.refs)
        }
      ])
      expect(computeRefs).toHaveBeenCalledWith(savedModel.trackIds)
      expect(computeRefs).toHaveBeenCalledTimes(1)
    })

    it('updates existing model and removes track ids and refs', async () => {
      const model = merge(models[2], {})
      delete model.refs
      model.removedTrackIds = JSON.parse(model.trackIds).slice(1, 2)
      model.trackIds = [faker.random.number()]
      const refs = [[faker.random.number(), faker.name.findName()]]
      computeRefs.mockResolvedValueOnce(refs)

      const { saved, removedIds } = await tested.save(model)

      const savedModel = {
        ...model,
        processedEpoch: null,
        removedTrackIds: undefined,
        trackIds: [JSON.parse(models[2].trackIds)[0], model.trackIds[0]],
        refs
      }

      expect(saved).toEqual([savedModel])
      expect(removedIds).toEqual([])
      expect(await db(modelName).where({ id: model.id })).toEqual([
        {
          ...savedModel,
          trackIds: JSON.stringify(savedModel.trackIds),
          refs: JSON.stringify(savedModel.refs)
        }
      ])
      expect(computeRefs).toHaveBeenCalledWith(savedModel.trackIds)
      expect(computeRefs).toHaveBeenCalledTimes(1)
    })

    it('updates existing and removes duplicates', async () => {
      const model = {
        ...models[2],
        trackIds: JSON.parse(models[2].trackIds)
      }
      const refs = null
      computeRefs.mockResolvedValueOnce(refs)

      const { saved, removedIds } = await tested.save(model)

      expect(saved).toEqual([
        {
          ...model,
          processedEpoch: null,
          refs
        }
      ])
      expect(removedIds).toEqual([])
      expect(await db(modelName).where({ id: model.id })).toEqual([
        {
          ...model,
          trackIds: JSON.stringify(model.trackIds),
          refs: JSON.stringify(refs),
          processedEpoch: null
        }
      ])
      expect(computeRefs).toHaveBeenCalledWith(model.trackIds)
      expect(computeRefs).toHaveBeenCalledTimes(1)
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
