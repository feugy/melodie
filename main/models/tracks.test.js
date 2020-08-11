'use strict'

const faker = require('faker')
const knex = require('knex')
const fs = require('fs-extra')
const os = require('os')
const { join } = require('path')
const { tracksModel } = require('./tracks')
const { hash } = require('../utils')

let dbFile
let db

describe('Tracks model', () => {
  const title = faker.commerce.productName()

  const models = [
    {
      path: faker.system.fileName(),
      tags: JSON.stringify({}),
      mtimeMs: 1590479078019.59
    },
    {
      path: faker.system.fileName(),
      tags: JSON.stringify({
        title,
        artists: [faker.name.findName()],
        album: faker.commerce.productName()
      }),
      mtimeMs: 1591821991051.59
    },
    {
      path: faker.system.fileName(),
      tags: JSON.stringify({
        title: `${faker.commerce.productAdjective()} ${title}`,
        artists: [faker.name.findName()]
      }),
      mtimeMs: 1459069600000.0
    },
    {
      path: faker.system.fileName(),
      tags: JSON.stringify({
        title: faker.commerce.productName(),
        artists: [],
        album: faker.commerce.productName()
      }),
      mtimeMs: 1472480286000.0
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
    await tracksModel.constructor.release()
  })

  afterAll(async () => {
    await db.context.destroy()
  })

  describe('save', () => {
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

      const oldTags = await tracksModel.save([track])
      expect(await tracksModel.getById(track.id)).toEqual(track)
      expect(oldTags).toEqual([
        { id: track.id, tags: JSON.parse(models[1].tags) }
      ])
    })
  })

  describe('listWithTime', () => {
    it('returns modification time by id', async () => {
      const result = await tracksModel.listWithTime()
      expect(result.get(models[0].id)).toEqual(models[0].mtimeMs)
      expect(result.get(models[1].id)).toEqual(models[1].mtimeMs)
      expect(result.get(models[2].id)).toEqual(models[2].mtimeMs)
      expect(result.get(models[3].id)).toEqual(models[3].mtimeMs)
      expect(result.size).toEqual(models.length)
    })
  })

  describe('list', () => {
    it('searches tracks with order and pagination', async () => {
      const { total, from, size, sort, results } = await tracksModel.list({
        size: 2,
        from: 1,
        searched: title,
        sort: '-id'
      })
      const sorted = models
        .filter(model => {
          const tags = JSON.parse(model.tags)
          return tags.title && tags.title.includes(title)
        })
        .sort((m1, m2) => {
          const t1 = JSON.parse(m1.tags)
          const t2 = JSON.parse(m2.tags)
          return !t1 && t2
            ? -1
            : !t2 && t1
            ? 1
            : !t1 && !t2
            ? 0
            : t2.title > t1.title
            ? -1
            : t1.title === t2.title
            ? 0
            : 1
        })
      expect(results).toEqual(
        sorted.slice(1).map(model => ({
          ...model,
          media: null,
          tags: JSON.parse(model.tags)
        }))
      )
      expect(results).toHaveLength(1)
      expect(total).toEqual(sorted.length)
      expect(size).toEqual(2)
      expect(from).toEqual(1)
      expect(sort).toEqual('+title.value')
    })

    it('returns empty search results page', async () => {
      const { total, from, size, sort, results } = await tracksModel.list({
        from: 20,
        searched: title
      })
      expect(results).toEqual([])
      expect(total).toEqual(2)
      expect(size).toEqual(10)
      expect(from).toEqual(20)
      expect(sort).toEqual('+title.value')
    })

    it('can return empty search results', async () => {
      const { total, from, size, sort, results } = await tracksModel.list({
        size: 2,
        from: 1,
        searched: 'unknown'
      })
      expect(results).toEqual([])
      expect(total).toEqual(0)
      expect(size).toEqual(2)
      expect(from).toEqual(1)
      expect(sort).toEqual('+title.value')
    })
  })
})
