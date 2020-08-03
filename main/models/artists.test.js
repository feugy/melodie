'use strict'

const faker = require('faker')
const fs = require('fs-extra')
const os = require('os')
const { join } = require('path')
const { artistsModel } = require('./artists')
const { hash } = require('../utils')

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
    const name = faker.commerce.productName()
    const artist = {
      id: hash(name),
      media: faker.image.image(),
      name,
      trackIds: [faker.random.number(), faker.random.number()],
      linked: []
    }

    await artistsModel.save(artist)
    expect((await artistsModel.list()).results).toEqual([artist])
  })
})
