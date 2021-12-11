'use strict'

const knex = require('knex')
const fs = require('fs-extra')
const os = require('os')
const { join } = require('path')
const { broadcast } = require('../utils')
const { settingsModel } = require('./settings')

let dbFile
let db

jest.mock('../utils/connection')

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
      },
      enqueueBehaviour: {
        onClick: true,
        clearBefore: true
      },
      broadcastPort: null,
      isBroadcasting: false,
      totpSecret: expect.any(String)
    })
    expect(broadcast).not.toHaveBeenCalled()
  })

  it('returns settings', async () => {
    const settings = (
      await db(settingsModel.name).select().where({ id: settingsModel.ID })
    )[0]
    expect(await settingsModel.get()).toEqual({
      ...settings,
      folders: JSON.parse(settings.folders),
      providers: JSON.parse(settings.providers),
      enqueueBehaviour: JSON.parse(settings.enqueueBehaviour),
      isBroadcasting: JSON.parse(settings.isBroadcasting)
    })
    expect(broadcast).not.toHaveBeenCalled()
  })

  it('returns modified settings on save', async () => {
    const settings = await settingsModel.get()
    settings.providers.deezer = { token: 'abc' }
    settings.isBroadcasting = true

    expect(await settingsModel.save(settings)).toEqual(settings)
    expect(broadcast).toHaveBeenCalledWith('settings-saved', settings)
    expect(broadcast).toHaveBeenCalledTimes(1)
  })
})
