'use strict'

const faker = require('faker')
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

  afterEach(async () => {
    if (await db.schema.hasTable(settingsModel.name)) {
      await db.schema.dropTable(settingsModel.name)
    }
    await settingsModel.constructor.release()
  })

  afterAll(async () => {
    await db.context.destroy()
  })

  describe('init', () => {
    it('creates settings', async () => {
      await settingsModel.init(dbFile)
      expect(await settingsModel.get()).toEqual({
        id: settingsModel.ID,
        folders: [],
        locale: null
      })
    })

    it('does not overrides settings when present', async () => {
      const locale = faker.random.word()
      const settings = {
        id: settingsModel.ID,
        folders: [faker.system.fileName(), faker.system.fileName()],
        locale
      }
      await db.schema.createTable(settingsModel.name, settingsModel.definition)
      await db(settingsModel.name).insert({
        ...settings,
        folders: JSON.stringify(settings.folders),
        locale
      })

      await settingsModel.init(dbFile)
      expect(await settingsModel.get()).toEqual(settings)
    })
  })

  describe('get', () => {
    beforeEach(async () => settingsModel.init(dbFile))

    it('returns settings', async () => {
      const settings = (
        await db(settingsModel.name).select().where({ id: settingsModel.ID })
      )[0]
      expect(await settingsModel.get()).toEqual({
        ...settings,
        folders: JSON.parse(settings.folders)
      })
    })
  })
})
