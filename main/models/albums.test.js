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
})
