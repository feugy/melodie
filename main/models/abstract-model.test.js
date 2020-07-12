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
      const results = await tested.list()
      expect(results).toEqual(
        expect.arrayContaining(
          models.map(model => ({
            ...model,
            tags: JSON.parse(model.tags)
          }))
        )
      )
      expect(results).toHaveLength(models.length)
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
