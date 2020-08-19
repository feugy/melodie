'use strict'

const faker = require('faker')
const fs = require('fs-extra')
const os = require('os')
const { join } = require('path')
const { artistsModel } = require('./artists')

describe('Tracks model', () => {
  beforeAll(async () => {
    const dbFile = join(
      await fs.mkdtemp(join(os.tmpdir(), 'melodie-')),
      'db.sqlite3'
    )
    await artistsModel.init(dbFile)
  })

  afterAll(async () => {
    await artistsModel.constructor.release()
  })

  it('adds new artist', async () => {
    const artist = {
      id: faker.random.number(),
      media: faker.image.image(),
      name: faker.commerce.productName(),
      trackIds: [faker.random.number(), faker.random.number()],
      refs: []
    }

    await artistsModel.save(artist)
    expect((await artistsModel.list()).results).toEqual([artist])
  })
})
