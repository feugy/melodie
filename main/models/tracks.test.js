'use strict'

const faker = require('faker')
const fs = require('fs-extra')
const os = require('os')
const { join } = require('path')
const { tracksModel } = require('./tracks')
const { hash } = require('../utils')

jest.mock('electron', () => ({ app: { getAppPath: jest.fn() } }))

describe('Tracks model', () => {
  beforeAll(async () => {
    const dbFile = join(
      await fs.mkdtemp(join(os.tmpdir(), 'melodie-')),
      'db.sqlite3'
    )
    await tracksModel.init(dbFile)
  })

  it('adds new track', async () => {
    const path = faker.system.fileName()
    const track = {
      id: hash(path),
      path,
      media: faker.image.image(),
      albumId: null,
      tags: {
        album: faker.commerce.productName(),
        artists: [faker.name.findName(), faker.name.findName()]
      }
    }

    await tracksModel.save(track)
    expect(await tracksModel.list()).toEqual([track])
  })
})
