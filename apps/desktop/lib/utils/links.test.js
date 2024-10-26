import { faker } from '@faker-js/faker'
import * as electron from 'electron'
import { EventEmitter } from 'events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { configureExternalLinks } from './links'

vi.mock('electron', () => ({ shell: { openExternal: vi.fn() } }))

describe('links utilities', () => {
  beforeEach(() => vi.resetAllMocks())

  describe('configureExternalLinks()', () => {
    it.each([
      ['http link', `http://${faker.internet.domainName}`],
      ['https link', `https://${faker.internet.domainName}`]
    ])('intercepts %s', (title, url) => {
      const webContents = new EventEmitter()
      const event = { preventDefault: vi.fn() }

      configureExternalLinks({ webContents })
      webContents.emit('will-navigate', event, url)

      expect(event.preventDefault).toHaveBeenCalled()
      expect(electron.shell.openExternal).toHaveBeenCalledWith(url)
      expect(electron.shell.openExternal).toHaveBeenCalledOnce()
    })

    it.each([
      ['relative link', `./${faker.internet.domainName}`],
      ['absolute link', `//${faker.internet.domainName}`]
    ])('does not intercept %s', (title, url) => {
      const webContents = new EventEmitter()
      const event = { preventDefault: vi.fn() }

      configureExternalLinks({ webContents })
      webContents.emit('will-navigate', event, url)

      expect(event.preventDefault).not.toHaveBeenCalled()
      expect(electron.shell.openExternal).not.toHaveBeenCalled()
    })
  })
})
