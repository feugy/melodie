'use strict'

const faker = require('faker')
const fs = require('fs-extra')
const os = require('os')
const { join } = require('path')
const { albumsModel } = require('./albums')
const { hash } = require('../utils')

jest.mock('electron', () => ({ app: { getAppPath: jest.fn() } }))

describe('Albums model', () => {
  beforeAll(async () => {
    const dbFile = join(
      await fs.mkdtemp(join(os.tmpdir(), 'melodie-')),
      'db.sqlite3'
    )
    await albumsModel.init(dbFile)
  })

  it('adds new album', async () => {
    const name = faker.commerce.productName()
    const album = {
      id: hash(name),
      media: faker.image.image(),
      name,
      trackIds: [faker.random.number(), faker.random.number()]
    }

    await albumsModel.save(album)
    expect(await albumsModel.list()).toEqual([album])
  })
})
