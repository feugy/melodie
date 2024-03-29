'use strict'

const faker = require('faker')
const knex = require('knex')
const fs = require('fs-extra')
const os = require('os')
const { join, resolve } = require('path')
const { tracksModel } = require('./tracks')
const { hash } = require('../utils')

let dbFile
let db

describe('Tracks model', () => {
  const title = faker.commerce.productName()
  const folder1 = resolve('home', 'user', 'my-music')
  const folder2 = resolve('home', 'user', 'desktop')

  const models = [
    {
      path: join(folder1, faker.system.fileName()),
      tags: JSON.stringify({}),
      media: faker.image.image(),
      mediaCount: faker.datatype.number({ min: 2, max: 10 }),
      mtimeMs: 1590479078019.59,
      ino: 2634312
    },
    {
      path: join(folder1, faker.random.word(), faker.system.fileName()),
      media: faker.image.image(),
      mediaCount: faker.datatype.number({ min: 2, max: 10 }),
      tags: JSON.stringify({
        title,
        artists: [faker.name.findName()],
        album: faker.commerce.productName()
      }),
      mtimeMs: 1591821991051.59,
      ino: 2674312
    },
    {
      path: join(folder2, faker.system.fileName()),
      tags: JSON.stringify({
        title: `${faker.commerce.productAdjective()} ${title}`,
        artists: [faker.name.findName()]
      }),
      mtimeMs: 1459069600000.0,
      ino: 2639112
    },
    {
      path: join('home', 'user', 'library', faker.system.fileName()),
      tags: JSON.stringify({
        title: faker.commerce.productName(),
        artists: [],
        album: faker.commerce.productName()
      }),
      mtimeMs: 1472480286000.0,
      ino: 4139112
    }
  ].map(track => ({
    ...track,
    id: hash(track.path),
    albumRef: track.tags.album
      ? [hash(track.tags.album), track.tags.album]
      : null,
    artistRefs: track.tags.artists
      ? track.tags.artists.map(artist => [hash(artist), artist])
      : null
  }))

  beforeAll(async () => {
    dbFile = join(await fs.mkdtemp(join(os.tmpdir(), 'melodie-')), 'db.sqlite3')
    db = knex({
      client: 'sqlite3',
      useNullAsDefault: true,
      connection: { filename: dbFile }
    })
    await tracksModel.init(dbFile)
  })

  beforeEach(async () => {
    await tracksModel.reset()
    await db(tracksModel.name).insert(models)
  })

  afterAll(async () => {
    await tracksModel.constructor.release()
    await db.context.destroy()
  })

  describe('save', () => {
    it('adds new track with refs', async () => {
      const path = faker.system.fileName()
      const album = faker.commerce.productName()
      const artists = [faker.name.findName(), faker.name.findName()]
      const track = {
        id: hash(path),
        path,
        media: faker.image.image(),
        mediaCount: faker.datatype.number({ min: 2, max: 10 }),
        mtimeMs: Date.now(),
        tags: { album, artists },
        ino: 2639762
      }

      const [{ current, previous }] = await tracksModel.save(track)
      expect(current).toEqual({
        ...track,
        albumRef: [hash(album), album],
        artistRefs: artists.map(artist => [hash(artist), artist])
      })
      expect(await tracksModel.getById(track.id)).toEqual({
        ...current
      })
      expect(previous).toBeNull()
    })

    it('handles missing album or artists', async () => {
      const path = faker.system.fileName()
      const track = {
        id: hash(path),
        path,
        media: faker.image.image(),
        mediaCount: faker.datatype.number({ max: 10 }),
        mtimeMs: Date.now(),
        tags: {},
        ino: 2639362
      }

      const [{ current, previous }] = await tracksModel.save(track)
      expect(current).toEqual({
        ...track,
        albumRef: [1, null],
        artistRefs: [[1, null]]
      })
      expect(await tracksModel.getById(track.id)).toEqual(current)
      expect(previous).toBeNull()
    })

    it('distinguishes tracks with same album name but different album artist', async () => {
      const path1 = faker.system.fileName()
      const path2 = faker.system.fileName()
      const album = faker.commerce.productName()
      const artists = [faker.name.findName(), faker.name.findName()]
      const track1 = {
        id: hash(path1),
        path: path1,
        media: faker.image.image(),
        mediaCount: faker.datatype.number({ max: 10 }),
        mtimeMs: Date.now(),
        tags: { album, artists: artists.slice(0, 1), albumartist: artists[0] },
        ino: 2459112
      }
      const track2 = {
        id: hash(path2),
        path: path2,
        media: faker.image.image(),
        mediaCount: faker.datatype.number({ max: 10 }),
        mtimeMs: Date.now(),
        tags: { album, artists: artists.slice(1), albumartist: artists[1] },
        ino: 3439112
      }

      const results = await tracksModel.save([track1, track2])
      expect(results[0].current.albumRef[0]).not.toEqual(
        results[1].current.albumRef[0]
      )
      expect(results[0].current).toEqual({
        ...track1,
        albumRef: [hash(`${album} --- ${artists[0]}`), album],
        artistRefs: [[hash(artists[0]), artists[0]]]
      })
      expect(results[1].current).toEqual({
        ...track2,
        albumRef: [hash(`${album} --- ${artists[1]}`), album],
        artistRefs: [[hash(artists[1]), artists[1]]]
      })
    })

    it('creates refs for artists and album artists', async () => {
      const album = faker.commerce.productName()
      const artists = [faker.name.findName(), faker.name.findName()]
      const albumartist = faker.name.findName()
      const track = {
        ...models[1],
        media: faker.image.image(),
        mediaCount: faker.datatype.number({ max: 10 }),
        mtimeMs: Date.now(),
        tags: { album, artists, albumartist },
        ino: 3439196
      }

      const [{ previous, current }] = await tracksModel.save([track])
      expect(current).toEqual({
        ...track,
        albumRef: [hash(`${album} --- ${albumartist}`), album],
        artistRefs: [albumartist, ...artists].map(artist => [
          hash(artist),
          artist
        ])
      })
      expect(await tracksModel.getById(track.id)).toEqual(current)
      expect(previous).toEqual({
        id: track.id,
        tags: JSON.parse(models[1].tags),
        artistRefs: JSON.parse(models[1].artistRefs),
        albumRef: JSON.parse(models[1].albumRef)
      })
    })

    it('removes duplicated (album) artists from refs', async () => {
      const album = faker.commerce.productName()
      const artists = [
        faker.name.findName(),
        faker.name.findName(),
        faker.name.findName()
      ]
      const track = {
        ...models[1],
        media: faker.image.image(),
        mediaCount: faker.datatype.number({ max: 10 }),
        mtimeMs: Date.now(),
        tags: {
          album,
          artists: [artists[0], artists[1], artists[0], artists[2]],
          albumartist: artists[0]
        },
        ino: 3439196
      }

      const [{ previous, current }] = await tracksModel.save([track])
      expect(current).toEqual({
        ...track,
        albumRef: [hash(`${album} --- ${artists[0]}`), album],
        artistRefs: artists.map(artist => [hash(artist), artist])
      })
      expect(await tracksModel.getById(track.id)).toEqual(current)
      expect(previous).toEqual({
        id: track.id,
        tags: JSON.parse(models[1].tags),
        artistRefs: JSON.parse(models[1].artistRefs),
        albumRef: JSON.parse(models[1].albumRef)
      })
    })

    it('returns old refs when saving existing track', async () => {
      const album = faker.commerce.productName()
      const artists = [faker.name.findName(), faker.name.findName()]
      const track = {
        ...models[1],
        media: faker.image.image(),
        mediaCount: faker.datatype.number({ max: 10 }),
        mtimeMs: Date.now(),
        tags: { album, artists },
        ino: 3439196
      }

      const [{ previous, current }] = await tracksModel.save([track])
      expect(current).toEqual({
        ...track,
        albumRef: [hash(album), album],
        artistRefs: artists.map(artist => [hash(artist), artist])
      })
      expect(await tracksModel.getById(track.id)).toEqual(current)
      expect(previous).toEqual({
        id: track.id,
        tags: JSON.parse(models[1].tags),
        artistRefs: JSON.parse(models[1].artistRefs),
        albumRef: JSON.parse(models[1].albumRef)
      })
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
          media: model.media || null,
          mediaCount: model.mediaCount || 1,
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

  describe('getByPath', () => {
    it('return direct children and descendants', async () => {
      const results = await tracksModel.getByPaths([folder1])
      expect(results).toEqual(
        expect.arrayContaining(
          [models[0], models[1]].map(model => ({
            ...model,
            media: model.media || null,
            mediaCount: model.mediaCount || 1,
            tags: JSON.parse(model.tags)
          }))
        )
      )
      expect(results).toHaveLength(2)
    })

    it('returns models from different folders', async () => {
      const results = await tracksModel.getByPaths([folder1, folder2])
      expect(results).toEqual(
        expect.arrayContaining(
          [models[0], models[1], models[2]].map(model => ({
            ...model,
            media: model.media || null,
            mediaCount: model.mediaCount || 1,
            tags: JSON.parse(model.tags)
          }))
        )
      )
      expect(results).toHaveLength(3)
    })

    it('can return an empty list', async () => {
      expect(
        await tracksModel.getByPaths([faker.system.directoryPath()])
      ).toEqual([])
    })
  })

  describe('serializeForUi', () => {
    it('handles falsy data', () => {
      expect(tracksModel.serializeForUi(null)).toBeNull()
      expect(tracksModel.serializeForUi()).toBeUndefined()
    })

    it('computes media and hides mediaCount attributes', () => {
      expect(tracksModel.serializeForUi(models[2])).toEqual({
        ...models[2],
        media: null,
        data: `/tracks/${models[2].id}/data`,
        mediaCount: undefined
      })
      expect(tracksModel.serializeForUi(models[1])).toEqual({
        ...models[1],
        media: `/tracks/${models[1].id}/media/${models[1].mediaCount}`,
        data: `/tracks/${models[1].id}/data`,
        mediaCount: undefined
      })
    })
  })
})
