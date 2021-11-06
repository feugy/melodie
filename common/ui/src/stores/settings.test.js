'use strict'

import { get } from 'svelte/store'
import faker from 'faker'
import {
  invoke,
  initConnection,
  closeConnection,
  serverEmitter
} from '../utils'
import { sleep } from '../tests'
import { saveBroadcastPort } from './settings'
import { totp } from './totp'

describe('settings store', () => {
  let settings
  let connected
  let askToAddFolder
  let removeFolder
  let saveAudioDBKey
  let saveDiscogsToken
  let saveEnqueueBehaviour
  let saveLocale
  let toggleBroadcast
  let init
  let isDesktop
  const locale = 'en'
  const key = faker.random.alphaNumeric(10)
  const token = faker.datatype.uuid()
  const providers = { audiodb: { key }, discogs: { token } }
  const enqueueBehaviour = { onClick: true, clearBefore: false }
  const folders = [faker.system.fileName(), faker.system.fileName()]
  const port = faker.datatype.number({ min: 2000, max: 10000 })

  beforeAll(async () => {
    ;({
      init,
      settings,
      connected,
      askToAddFolder,
      removeFolder,
      saveAudioDBKey,
      saveDiscogsToken,
      saveEnqueueBehaviour,
      saveLocale,
      toggleBroadcast,
      isDesktop
    } = await import('./settings'))
  })

  beforeEach(() => {
    location.hash = `#/`
    jest.resetAllMocks()
    // for testing, force desktop
    isDesktop.next(true)
  })

  describe('init()', () => {
    const url = `${faker.internet.protocol()}://${faker.internet.ip()}:${port}`
    const values = {
      locale,
      folders,
      enqueueBehaviour,
      providers
    }
    const totpValue = faker.datatype.number().toString()

    it('handles connection failure', async () => {
      const err = new Error('Connection error')
      initConnection.mockImplementationOnce(
        async (address, onConnectionLost) => {
          onConnectionLost(err)
          return false
        }
      )
      init(url)

      await sleep()

      expect(get(connected)).toEqual(false)
      expect(get(settings)).toEqual({
        enqueueBehaviour: {},
        isBroadcasting: false,
        providers: { audiodb: {}, discogs: {} }
      })
      expect(initConnection).toHaveBeenCalledWith(
        url,
        expect.any(Function),
        expect.any(Function)
      )
      expect(initConnection).toHaveBeenCalledTimes(1)
      expect(invoke).not.toHaveBeenCalled()
    })

    it('loads settings', async () => {
      invoke.mockResolvedValue(values)
      initConnection.mockImplementationOnce(
        async (address, onConnectionLost, getAuthDetails) => {
          await getAuthDetails()
          return true
        }
      )
      await init(url, null, totpValue)

      expect(get(connected)).toEqual(true)
      expect(get(settings)).toEqual(values)
      expect(initConnection).toHaveBeenCalledWith(
        url,
        expect.any(Function),
        expect.any(Function)
      )
      expect(initConnection).toHaveBeenCalledTimes(1)
      expect(invoke).toHaveBeenCalledTimes(1)
      expect(get(totp)).toEqual(totpValue)
    })

    it('handles lost connection and retries', async () => {
      invoke.mockResolvedValue(values)
      initConnection
        .mockResolvedValueOnce(true)
        .mockImplementationOnce(async (address, onConnectionLost) => {
          onConnectionLost()
          return false
        })
        .mockImplementationOnce(async (address, onConnectionLost) => {
          onConnectionLost()
          return false
        })
        .mockResolvedValueOnce(true)

      await init(url)

      expect(get(connected)).toEqual(true)
      expect(initConnection).toHaveBeenCalledTimes(1)
      await initConnection.mock.calls[0][1]()

      expect(get(connected)).toEqual(false)
      await sleep(100)

      expect(initConnection).toHaveBeenCalledTimes(2)
      expect(get(connected)).toEqual(false)

      await sleep(300)
      expect(initConnection).toHaveBeenCalledTimes(4)

      expect(get(connected)).toEqual(true)
      expect(get(settings)).toEqual(values)
    })
  })

  describe('given initialization', () => {
    beforeEach(async () => {
      initConnection.mockResolvedValueOnce(true)
      await init(
        `${faker.internet.protocol()}://${faker.internet.ip()}:${port}`
      )
      jest.resetAllMocks()
    })

    it('redirects to albums on successful folder addition', async () => {
      invoke.mockResolvedValueOnce(true)
      await askToAddFolder()
      await sleep(10)

      expect(invoke).toHaveBeenCalledWith('settings.addFolders')
      expect(location.hash).toEqual('#/album')
    })

    it('does not redirect to albums on cancelled folder addition', async () => {
      invoke.mockResolvedValueOnce(false)
      await askToAddFolder()
      await sleep(10)

      expect(invoke).toHaveBeenCalledWith('settings.addFolders')
      expect(location.hash).toEqual('#/')
    })

    it('can not add folders on browser', async () => {
      isDesktop.next(false)
      await expect(askToAddFolder()).rejects.toThrow(/not supported/)
      expect(invoke).not.toHaveBeenCalled()
    })

    it('updates settings on server event', async () => {
      const newValues = {
        locale,
        folders,
        enqueueBehaviour,
        providers,
        isBroadcasting: true
      }
      expect(get(settings)).not.toEqual(newValues)

      serverEmitter.next({ event: 'settings-saved', args: newValues })
      expect(get(settings)).toEqual(newValues)
      expect(invoke).not.toHaveBeenCalled()
    })

    it('can remove folders', async () => {
      const removed = faker.random.arrayElement(folders)
      await removeFolder(removed)

      expect(invoke).toHaveBeenCalledWith('settings.removeFolder', removed)
    })

    it('can save locale', async () => {
      const locale = faker.random.arrayElement(['en', 'fr'])
      await saveLocale(locale)

      expect(invoke).toHaveBeenCalledWith('settings.setLocale', locale)
    })

    it('can save AudioDB key', async () => {
      const key = faker.random.alphaNumeric(10)
      await saveAudioDBKey(key)

      expect(invoke).toHaveBeenCalledWith('settings.setAudioDBKey', key)
    })

    it('can save Discogs token', async () => {
      const token = faker.datatype.uuid()
      await saveDiscogsToken(token)

      expect(invoke).toHaveBeenCalledWith('settings.setDiscogsToken', token)
    })

    it('can save enqueue behaviour', async () => {
      const onClick = faker.datatype.boolean()
      const clearBefore = faker.datatype.boolean()
      await saveEnqueueBehaviour({ onClick, clearBefore })

      expect(invoke).toHaveBeenCalledWith('settings.setEnqueueBehaviour', {
        onClick,
        clearBefore
      })
    })

    it('can set broadcast port', async () => {
      const port = faker.datatype.number()
      await saveBroadcastPort(port)

      expect(invoke).toHaveBeenCalledWith('settings.setBroadcastPort', port)
    })

    it('can toggle broadcast on and connect to the new address, unless on browser', async () => {
      const values = {
        locale,
        folders,
        enqueueBehaviour,
        providers
      }
      initConnection.mockResolvedValueOnce(true)
      invoke.mockResolvedValueOnce(values)

      toggleBroadcast()
      await sleep(50)

      expect(get(connected)).toEqual(true)
      expect(get(settings)).toEqual(values)

      expect(invoke).toHaveBeenCalledWith('settings.toggleBroadcast')
      expect(closeConnection).toHaveBeenCalledTimes(1)
      expect(initConnection).toHaveBeenCalledWith(
        `ws://localhost:${port}`,
        expect.any(Function),
        expect.any(Function)
      )
      expect(initConnection).toHaveBeenCalledTimes(1)

      isDesktop.next(false)
      await expect(toggleBroadcast()).rejects.toThrow(/not supported/)
      expect(invoke).toHaveBeenCalledTimes(1)
    })

    it('retries connecting to new address when toggling broadcast', async () => {
      const values = {
        locale,
        folders,
        enqueueBehaviour,
        providers
      }
      initConnection
        .mockImplementationOnce(async (address, onConnectionLost) => {
          onConnectionLost()
          return false
        })
        .mockImplementationOnce(async (address, onConnectionLost) => {
          onConnectionLost()
          return false
        })
        .mockResolvedValueOnce(true)
      invoke.mockResolvedValueOnce(values)

      toggleBroadcast()
      await sleep(50)

      // will first fail, then retries
      expect(get(connected)).toEqual(false)

      expect(invoke).toHaveBeenCalledWith('settings.toggleBroadcast')
      expect(invoke).toHaveBeenCalledTimes(1)
      expect(closeConnection).toHaveBeenCalledTimes(1)
      expect(initConnection).toHaveBeenCalledWith(
        `ws://localhost:${port}`,
        expect.any(Function),
        expect.any(Function)
      )
      expect(initConnection).toHaveBeenCalledTimes(1)

      await sleep(300)
      expect(get(connected)).toEqual(true)
      expect(initConnection).toHaveBeenCalledTimes(3)
    })
  })
})
