'use strict'

const faker = require('faker')
const fs = require('fs-extra')
const os = require('os')
const { join } = require('path')
const { albumsModel } = require('./albums')

describe('Albums model', () => {
  beforeAll(async () => {
    const dbFile = join(
      await fs.mkdtemp(join(os.tmpdir(), 'melodie-')),
      'db.sqlite3'
    )
    await albumsModel.init(dbFile)
  })

  afterAll(async () => {
    await albumsModel.constructor.release()
  })

  it('adds new album', async () => {
    const album = {
      id: faker.random.number(),
      media: faker.image.image(),
      name: faker.commerce.productName(),
      trackIds: [faker.random.number(), faker.random.number()],
      refs: []
    }

    await albumsModel.save(album)
    expect((await albumsModel.list()).results).toEqual([album])
  })

  describe('given some albums', () => {
    const name = faker.commerce.productName()

    const album1 = {
      id: faker.random.number(),
      media: faker.image.image(),
      name,
      trackIds: [faker.random.number(), faker.random.number()],
      refs: []
    }
    const album2 = {
      id: faker.random.number(),
      media: faker.image.image(),
      name: faker.commerce.productName(),
      trackIds: [faker.random.number(), faker.random.number()],
      refs: []
    }
    const album3 = {
      id: faker.random.number(),
      media: faker.image.image(),
      name,
      trackIds: [faker.random.number(), faker.random.number()],
      refs: []
    }

    beforeAll(async () => albumsModel.save([album1, album2, album3]))

    it('returns several albums by name', async () => {
      const results = await albumsModel.getByName(name)
      expect(results).toEqual(expect.arrayContaining([album1, album3]))
      expect(results).toHaveLength(2)
    })

    it('returns single album by name', async () => {
      expect(await albumsModel.getByName(album2.name)).toEqual([album2])
    })

    it('returns empty results on unknown name', async () => {
      expect(await albumsModel.getByName(faker.commerce.productName())).toEqual(
        []
      )
    })
  })
})
