'use strict'

const faker = require('faker')
const knex = require('knex')
const os = require('os')
const fs = require('fs-extra')
const { join, resolve } = require('path')
const Model = require('./abstract-model')

const modelName = 'test'

class Test extends Model {
  constructor() {
    super({ name: modelName, jsonColumns: ['tags'], searchCol: 'name' })
  }
}

let dbFile
let db
const migrationFolder = resolve(__dirname, 'migrations')
const allMigrations = fs.readdirSync(migrationFolder).sort()
const latestMigration = allMigrations[allMigrations.length - 1]
const migrationsTable = 'knex_migrations'

describe('Abstract model', () => {
  beforeAll(async () => {
    dbFile = join(await fs.mkdtemp(join(os.tmpdir(), 'melodie-')), 'db.sqlite3')
    db = knex({
      client: 'sqlite3',
      useNullAsDefault: true,
      connection: { filename: dbFile },
      migrations: { directory: migrationFolder },
      log: { warn: () => {} }
    })
  })

  afterAll(async () => {
    await db.context.destroy()
  })

  it('can not constructor model without name', () => {
    expect(() => new Model({})).toThrow(/every model needs a name/)
  })

  describe('init', () => {
    afterEach(async () => {
      await db.schema.dropTableIfExists(migrationsTable)
      await db.schema.dropTableIfExists('settings')
      await db.schema.dropTableIfExists('albums')
      await db.schema.dropTableIfExists('artists')
      await db.schema.dropTableIfExists('tracks')
      await db.schema.dropTableIfExists('playlists')
      await Model.release()
    })

    it('can not create init without db file', async () => {
      expect(new Test().init()).rejects.toThrow(
        /must be initialized with an sqlite3 file/
      )
    })

    it('triggers migrations', async () => {
      const tested = new Test(modelName)
      await tested.init(dbFile)
      expect(await db.schema.hasTable(migrationsTable)).toBe(true)
      expect(await db(migrationsTable).select()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: allMigrations.length,
            name: latestMigration
          })
        ])
      )
    })

    it('does not trigger migration if already at the latest', async () => {
      await db.schema.createTable(migrationsTable, table => {
        table.integer('id')
        table.string('name')
        table.integer('batch')
      })
      await db(migrationsTable).insert(
        allMigrations.map((name, id) => ({ id, name }))
      )

      const tested = new Test(modelName)
      await tested.init(dbFile)
      expect(await db(migrationsTable).count({ c: 'id' })).toEqual([
        { c: allMigrations.length }
      ])
    })
  })

  describe('given some data', () => {
    const tested = new Test()
    const name = faker.name.findName()
    const models = [
      { id: faker.datatype.number(), name, tags: '{}' },
      { id: faker.datatype.number(), name: faker.name.findName(), tags: '{}' },
      {
        id: faker.datatype.number(),
        name: `${name} ${faker.name.findName()}`,
        tags: '{}'
      },
      { id: faker.datatype.number(), name: faker.name.findName(), tags: '{}' }
    ]

    beforeEach(async () => {
      await db.schema.createTable(modelName, table => {
        table.integer('id').primary()
        table.string('name')
        table.json('tags')
      })
      await db(modelName).insert(models)
      await tested.init(dbFile)
    })

    afterEach(async () => {
      if (await db.schema.hasTable(modelName)) {
        await db.schema.dropTable(modelName)
      }
      await Model.release()
    })

    describe('reset', () => {
      it('resets table', async () => {
        expect(await db(modelName).count({ c: 'id' })).toEqual([
          { c: models.length }
        ])
        await tested.reset()
        expect(await db(modelName).count({ c: 'id' })).toEqual([{ c: 0 }])
      })
    })

    describe('save', () => {
      it('adds single model', async () => {
        const model = {
          id: faker.datatype.number(),
          name: faker.name.findName(),
          tags: {}
        }

        await tested.save(model)
        expect(await db(modelName).where({ id: model.id }).select()).toEqual([
          {
            ...model,
            tags: JSON.stringify(model.tags)
          }
        ])
      })

      it('adds multiple models', async () => {
        const models = [
          {
            id: faker.datatype.number(),
            name: faker.name.findName(),
            tags: {}
          },
          { id: faker.datatype.number(), name: faker.name.findName(), tags: {} }
        ]

        await tested.save(models)
        expect(
          await db(modelName)
            .whereIn(
              'id',
              models.map(({ id }) => id)
            )
            .select()
        ).toEqual(
          expect.arrayContaining(
            models.map(model => ({
              ...model,
              tags: JSON.stringify(model.tags)
            }))
          )
        )
      })

      it('update existing models', async () => {
        const originals = [
          {
            id: faker.datatype.number(),
            name: faker.name.findName(),
            tags: { old: true }
          },
          {
            id: faker.datatype.number(),
            name: faker.name.findName(),
            tags: { n: 10 }
          }
        ]
        const models = [
          {
            id: originals[0].id,
            tags: { new: true }
          },
          { id: originals[1].id, tags: { n: 22 } }
        ]
        await db(modelName).insert(
          originals.map(original => ({
            ...original,
            tags: JSON.stringify(original.tags)
          }))
        )

        await tested.save(models)
        expect(
          await db(modelName)
            .whereIn(
              'id',
              models.map(({ id }) => id)
            )
            .select()
        ).toEqual(
          expect.arrayContaining(
            models.map((model, i) => ({
              ...originals[i],
              ...model,
              tags: JSON.stringify(model.tags)
            }))
          )
        )
      })

      it.each([
        [undefined, 'null'],
        [null, 'null'],
        [false, 'false'],
        [0, 0],
        ['', '""'],
        [[], '[]'],
        [{}, '{}'],
        [true, 'true'],
        [10, 10],
        [['a', 'b'], '["a","b"]'],
        [{ foo: 'bar', baz: [1, 2] }, '{"foo":"bar","baz":[1,2]}']
      ])('serializes %j as JSON data', async (tags, expected) => {
        const id = faker.datatype.number()
        await tested.save([{ id, tags }])
        expect(await db(modelName).where({ id }).select()).toEqual([
          { id, name: null, tags: expected }
        ])
      })
    })

    describe('list', () => {
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

      it('searches models with order and pagination', async () => {
        const { total, from, size, sort, results } = await tested.list({
          size: 2,
          from: 1,
          searched: name,
          sort: '-id'
        })
        const sorted = models
          .filter(model => model.name.includes(name))
          .sort((m1, m2) =>
            m1.name > m2.name ? 1 : m1.name === m2.name ? 0 : -1
          )
        expect(results).toEqual(
          sorted.slice(1).map(model => ({
            ...model,
            tags: JSON.parse(model.tags)
          }))
        )
        expect(results).toHaveLength(1)
        expect(total).toEqual(sorted.length)
        expect(size).toEqual(2)
        expect(from).toEqual(1)
        expect(sort).toEqual('+name')
      })

      it('returns empty search results page', async () => {
        const { total, from, size, sort, results } = await tested.list({
          from: 20,
          searched: name
        })
        expect(results).toEqual([])
        expect(total).toEqual(2)
        expect(size).toEqual(10)
        expect(from).toEqual(20)
        expect(sort).toEqual('+name')
      })

      it('can return empty search results', async () => {
        const { total, from, size, sort, results } = await tested.list({
          size: 2,
          from: 1,
          searched: 'unknown'
        })
        expect(results).toEqual([])
        expect(total).toEqual(0)
        expect(size).toEqual(2)
        expect(from).toEqual(1)
        expect(sort).toEqual('+name')
      })
    })

    describe('getById', () => {
      it('returns null when getting unknown model by id', async () => {
        expect(await tested.getById(faker.datatype.number())).toBe(null)
      })

      it('gets models by ids', async () => {
        const results = await tested.getByIds([
          models[0].id,
          models[3].id,
          faker.datatype.number()
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

      it('throws meaningful error on deserialization error', async () => {
        const id = faker.datatype.number()
        await db(modelName).insert({ id, name, tags: '{' })
        expect(tested.getByIds([id])).rejects.toThrow(
          /failed to deserialize value "{" for col tags: Unexpected end of JSON input/
        )
      })
    })

    describe('removeByIds', () => {
      it('removes models by ids', async () => {
        const removed = await tested.removeByIds([
          models[0].id,
          models[3].id,
          faker.datatype.number()
        ])

        expect(removed).toEqual(
          expect.arrayContaining([
            {
              ...models[0],
              tags: JSON.parse(models[0].tags)
            }
          ])
        )
        expect(removed).toEqual(
          expect.arrayContaining([
            {
              ...models[3],
              tags: JSON.parse(models[3].tags)
            }
          ])
        )
        expect(removed).toHaveLength(2)
        const ids = (
          await db(modelName)
            .select('id')
            .whereIn(
              'id',
              models.map(({ id }) => id)
            )
        ).map(({ id }) => id)
        expect(ids).toEqual(
          expect.not.arrayContaining([models[0].id, models[3].id])
        )
        expect(ids).toHaveLength(2)
      })
    })
  })
})
