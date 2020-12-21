'use strict'

const { EventEmitter } = require('events')
const electron = require('electron')
const faker = require('faker')
const { configureExternalLinks } = require('./links')

jest.mock('electron', () => ({ shell: { openExternal: jest.fn() } }))

describe('links utilities', () => {
  beforeEach(jest.resetAllMocks)

  describe('configureExternalLinks()', () => {
    it.each([
      ['http link', `http://${faker.internet.domainName}`],
      ['https link', `https://${faker.internet.domainName}`]
    ])('intercepts %s', (title, url) => {
      const webContents = new EventEmitter()
      const event = { preventDefault: jest.fn() }

      configureExternalLinks({ webContents })
      webContents.emit('will-navigate', event, url)

      expect(event.preventDefault).toHaveBeenCalled()
      expect(electron.shell.openExternal).toHaveBeenCalledWith(url)
      expect(electron.shell.openExternal).toHaveBeenCalledTimes(1)
    })

    it.each([
      ['relative link', `./${faker.internet.domainName}`],
      ['absolute link', `//${faker.internet.domainName}`]
    ])('does not intercept %s', (title, url) => {
      const webContents = new EventEmitter()
      const event = { preventDefault: jest.fn() }

      configureExternalLinks({ webContents })
      webContents.emit('will-navigate', event, url)

      expect(event.preventDefault).not.toHaveBeenCalled()
      expect(electron.shell.openExternal).not.toHaveBeenCalled()
    })
  })
})
