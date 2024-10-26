import { faker } from '@faker-js/faker'
import { models, utils } from '@melodie/core'
import * as services from '@melodie/core/lib/services'
import * as electron from 'electron'
import { join } from 'path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { focusOnNotification } from '../utils'
import { start } from '.'
import * as playlists from './playlists'
import * as settings from './settings'
import * as tracks from './tracks'

vi.mock('@melodie/core/lib/utils')
vi.mock('@melodie/core/lib/models')
vi.mock('@melodie/core/lib/services/settings')
vi.mock('@melodie/core/lib/services/tracks')
vi.mock('../utils/window-state')

describe('Services', () => {
  beforeEach(() => vi.resetAllMocks())

  it('starts core service, initializes models and settings', async () => {
    const publicFolder = faker.system.filePath()
    const port1 = faker.number.int()
    const port2 = faker.number.int()
    const path = faker.system.filePath()
    const totp = { foo: 'bar' }
    electron.app.getPath.mockReturnValue(path)
    const close = vi.fn()
    utils.initConnection.mockResolvedValue({
      close,
      address: `ws:localhost:${port2}`,
      totp
    })
    expect(await start(publicFolder, {}, {}, port1)).toEqual({
      close,
      port: port2,
      totp
    })

    expect(models.init).toHaveBeenCalledWith(join(path, 'db.sqlite3'))
    expect(models.init).toHaveBeenCalledOnce()
    expect(utils.initConnection).toHaveBeenCalledWith(
      {
        playlists,
        settings,
        tracks,
        media: services.media,
        core: expect.any(Object)
      },
      publicFolder,
      port1
    )
    expect(services.settings.init).toHaveBeenCalledOnce()
    expect(services.settings.init).toHaveBeenCalledWith(port2)
    expect(services.tracks.listen).toHaveBeenCalledOnce()
    expect(close).not.toHaveBeenCalled()
  })

  describe('given initialization', () => {
    let services
    const window = { foo: 'bar' }
    const name = faker.person.firstName()
    const version = faker.system.semver()

    beforeEach(async () => {
      electron.app.getPath.mockReturnValue(faker.system.filePath())
      utils.initConnection.mockResolvedValue({ address: faker.internet.url() })
      await start('', window, { name, version })
      services = utils.initConnection.mock.calls[0][0]
    })

    it('exposes core.getVersions()', async () => {
      expect(await services.core.getVersions()).toHaveProperty(name, version)
    })

    it('exposes core.focusWindow()', async () => {
      await services.core.focusWindow()
      expect(focusOnNotification).toHaveBeenCalledWith(window)
      expect(focusOnNotification).toHaveBeenCalledOnce()
    })
  })
})
