'use strict'

const knex = require('knex')
const fs = require('fs-extra')
const os = require('os')
const { join } = require('path')
const { settingsModel } = require('./settings')

let dbFile
let db

describe('Settings model', () => {
  beforeAll(async () => {
    dbFile = join(await fs.mkdtemp(join(os.tmpdir(), 'melodie-')), 'db.sqlite3')
    db = knex({
      client: 'sqlite3',
      useNullAsDefault: true,
      connection: { filename: dbFile }
    })
  })

  afterAll(async () => {
    await settingsModel.constructor.release()
    await db.context.destroy()
  })

  it('creates default settings on init', async () => {
    await settingsModel.init(dbFile)
    expect(await settingsModel.get()).toEqual({
      id: settingsModel.ID,
      folders: [],
      locale: null,
      openCount: 1,
      providers: {
        audiodb: {},
        discogs: {}
      }
    })
  })

  it('returns settings', async () => {
    const settings = (
      await db(settingsModel.name).select().where({ id: settingsModel.ID })
    )[0]
    expect(await settingsModel.get()).toEqual({
      ...settings,
      folders: JSON.parse(settings.folders),
      providers: JSON.parse(settings.providers)
    })
  })
})
