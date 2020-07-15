'use strict'

const faker = require('faker')
const knex = require('knex')
const os = require('os')
const fs = require('fs-extra')
const { join } = require('path')
const Model = require('./abstract-model')

const modelName = 'test'

class Test extends Model {
  constructor() {
    super(modelName, table => {
      table.integer('id').primary()
      table.string('name')
      table.json('tags')
    })
    this.jsonColumns = ['tags']
  }
}

let dbFile
let db

describe('Abstract model', () => {
  beforeAll(async () => {
    dbFile = join(await fs.mkdtemp(join(os.tmpdir(), 'melodie-')), 'db.sqlite3')
    db = knex({
      client: 'sqlite3',
      useNullAsDefault: true,
      connection: { filename: dbFile }
    })
  })

  afterEach(async () => {
    if (await db.schema.hasTable(modelName)) {
      await db.schema.dropTable(modelName)
    }
  })

  it('can not create model without name', () => {
    expect(() => new Model()).toThrow(/every model needs a name/)
  })

  it('can not create model without definition', () => {
    expect(() => new Model('definitionless')).toThrow(
      /definitionless model needs a table definition/
    )
  })

  it('can not create init without db file', async () => {
    expect(new Test().init()).rejects.toThrow(
      /must be initialized with an sqlite3 file/
    )
  })

  it('creates table on init', async () => {
    const tested = new Test(modelName)
    await tested.init(dbFile)
    expect(await db.schema.hasTable(modelName)).toBe(true)
  })

  it('does not creates table on init if it exists', async () => {
    const tested = new Test(modelName)
    await db.schema.createTable(modelName, table => {
      table.integer('id')
    })
    await tested.init(dbFile)
    expect(await db.schema.hasTable(modelName)).toBe(true)
  })

  describe('given some data', () => {
    const tested = new Test()
    const models = [
      { id: faker.random.number(), name: faker.name.findName(), tags: '{}' },
      { id: faker.random.number(), name: faker.name.findName(), tags: '{}' },
      { id: faker.random.number(), name: faker.name.findName(), tags: '{}' },
      { id: faker.random.number(), name: faker.name.findName(), tags: '{}' }
    ]

    beforeEach(async () => {
      await tested.init(dbFile)
      await db(modelName).insert(models)
    })

    it('resets table', async () => {
      expect(await db(modelName).count({ c: 'id' })).toEqual([
        {
          c: models.length
        }
      ])
      await tested.reset()
      expect(await db(modelName).count({ c: 'id' })).toEqual([
        {
          c: 0
        }
      ])
    })

    it('lists models', async () => {
      const { total, results, size, sort, from } = await tested.list()
      expect(results).toEqual(
        expect.arrayContaining(
          models.map(model => ({
            ...model,
            tags: JSON.parse(model.tags)
          }))
        )
      )
      expect(results).toHaveLength(models.length)
      expect(total).toEqual(models.length)
      expect(size).toEqual(10)
      expect(from).toEqual(0)
      expect(sort).toEqual('+id')
    })

    it('lists models with order and pagination', async () => {
      const { total, from, size, sort, results } = await tested.list({
        size: 2,
        from: 1,
        sort: '-name'
      })
      const sorted = models.sort((m1, m2) =>
        m1.name > m2.name ? -1 : m1.name === m2.name ? 0 : 1
      )
      expect(results).toEqual(
        sorted.slice(1, 3).map(model => ({
          ...model,
          tags: JSON.parse(model.tags)
        }))
      )
      expect(results).toHaveLength(size)
      expect(total).toEqual(models.length)
      expect(size).toEqual(2)
      expect(from).toEqual(1)
      expect(sort).toEqual('-name')
    })

    it('lists models with bigger size than resultset', async () => {
      const { total, from, size, sort, results } = await tested.list({
        size: 100
      })
      expect(results).toEqual(
        models
          .map(model => ({
            ...model,
            tags: JSON.parse(model.tags)
          }))
          .sort((a, b) => a.id - b.id)
      )
      expect(total).toEqual(models.length)
      expect(size).toEqual(100)
      expect(from).toEqual(0)
      expect(sort).toEqual('+id')
    })

    it('lists models with out of range page', async () => {
      const { total, from, size, sort, results } = await tested.list({
        from: 10
      })
      expect(results).toEqual([])
      expect(total).toEqual(models.length)
      expect(size).toEqual(10)
      expect(from).toEqual(10)
      expect(sort).toEqual('+id')
    })

    it('get model by id', async () => {
      const model = models[1]
      const results = await tested.getById(model.id)
      expect(results).toEqual({
        ...model,
        tags: JSON.parse(model.tags)
      })
    })

    it('returns null when getting unknown model by id', async () => {
      expect(await tested.getById(faker.random.number())).toBe(null)
    })

    it('gets models by ids', async () => {
      const results = await tested.getByIds([
        models[0].id,
        models[3].id,
        faker.random.number()
      ])
      expect(results).toEqual(
        expect.arrayContaining(
          [models[0], models[3]].map(model => ({
            ...model,
            tags: JSON.parse(model.tags)
          }))
        )
      )
      expect(results).toHaveLength(2)
    })

    it('adds new model', async () => {
      const model = {
        id: faker.random.number(),
        name: faker.name.findName(),
        tags: { new: true }
      }
      await tested.save(model)
      expect(await db(modelName).where({ id: model.id })).toEqual([
        {
          ...model,
          tags: JSON.stringify(model.tags)
        }
      ])
    })

    it('saves multipe models', async () => {
      const models = [
        {
          id: faker.random.number(),
          name: faker.name.findName(),
          tags: { new: true }
        },
        {
          id: faker.random.number(),
          name: faker.name.findName(),
          tags: { new: true }
        }
      ]
      await tested.save(models)
      for (const model of models) {
        expect(await db(modelName).where({ id: model.id })).toEqual([
          {
            ...model,
            tags: JSON.stringify(model.tags)
          }
        ])
      }
    })

    it('updates existing model', async () => {
      const model = models[1]
      model.tags = { updated: true, tmp: faker.lorem.words() }
      await tested.save(model)
      expect(await db(modelName).where({ id: model.id })).toEqual([
        {
          ...model,
          tags: JSON.stringify(model.tags)
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
          tags: 'null'
        }
      ])
      expect(await tested.getById(model.id)).toEqual({
        ...model,
        tags: null
      })
    })
  })
})
