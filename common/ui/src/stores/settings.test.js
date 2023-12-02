import { faker } from '@faker-js/faker'
import { get } from 'svelte/store'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { sleep } from '../tests'
import {
  closeConnection,
  initConnection,
  invoke,
  serverEmitter
} from '../utils'
import { setTotp, totp } from './totp'

describe('settings store', () => {
  let settings
  let connected
  let askToAddFolder
  let removeFolder
  let saveAudioDBKey
  let saveBroadcastPort
  let saveDiscogsToken
  let saveEnqueueBehaviour
  let saveLocale
  let toggleBroadcast
  let init
  let isDesktop
  const locale = 'en'
  const key = faker.string.alphanumeric(10)
  const token = faker.string.uuid()
  const providers = { audiodb: { key }, discogs: { token } }
  const enqueueBehaviour = { onClick: true, clearBefore: false }
  const folders = [faker.system.fileName(), faker.system.fileName()]
  const port = faker.number.int({ min: 2000, max: 10000 })
  const fetch = vi.spyOn(global, 'fetch')
  vi.spyOn(console, 'trace').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})

  beforeAll(async () => {
    ;({
      init,
      settings,
      connected,
      askToAddFolder,
      removeFolder,
      saveBroadcastPort,
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
    vi.resetAllMocks()
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
    const totpValue = faker.number.int().toString()

    it('handles connection failure', async () => {
      const err = new Error('Connection error')
      initConnection.mockImplementationOnce(
        async (address, token, onConnectionLost) => {
          onConnectionLost(err)
          return false
        }
      )
      init(url)

      await sleep()

      expect(get(connected)).toBe(false)
      expect(get(settings)).toEqual({
        enqueueBehaviour: {},
        isBroadcasting: false,
        providers: { audiodb: {}, discogs: {} }
      })
      expect(initConnection).toHaveBeenCalledWith(
        url,
        null,
        expect.any(Function),
        expect.any(Function)
      )
      expect(initConnection).toHaveBeenCalledOnce()
      expect(invoke).not.toHaveBeenCalled()
    })

    it('loads settings', async () => {
      initConnection.mockResolvedValueOnce(values)
      await init(url, null, totpValue)

      expect(get(connected)).toBe(true)
      expect(get(settings)).toEqual(values)
      expect(initConnection).toHaveBeenCalledWith(
        url,
        null,
        expect.any(Function),
        expect.any(Function)
      )
      expect(initConnection).toHaveBeenCalledOnce()
      expect(invoke).not.toHaveBeenCalled()
      expect(get(totp)).toEqual(totpValue)
    })

    it('handles lost connection and retries', async () => {
      initConnection
        .mockResolvedValueOnce(values)
        .mockImplementationOnce(async (address, totp, onConnectionLost) => {
          onConnectionLost()
        })
        .mockImplementationOnce(async (address, totp, onConnectionLost) => {
          onConnectionLost()
        })
        .mockResolvedValueOnce(values)

      await init(url, undefined, undefined, 100)

      expect(get(connected)).toBe(true)
      expect(initConnection).toHaveBeenCalledOnce()
      await initConnection.mock.calls[0][2]()

      expect(get(connected)).toBe(false)
      await sleep(100)
      expect(initConnection).toHaveBeenCalledTimes(2)
      expect(get(connected)).toBe(false)

      await sleep(300)
      expect(initConnection).toHaveBeenCalledTimes(4)

      expect(get(connected)).toBe(true)
      expect(get(settings)).toEqual(values)
    })
  })

  describe('given initialization on desktop', () => {
    const serverAddress = `${faker.internet.protocol()}://${faker.internet.ip()}:${port}`

    beforeEach(async () => {
      initConnection.mockResolvedValueOnce({
        locale,
        folders,
        enqueueBehaviour,
        providers
      })
      await init(serverAddress, null)
    })

    it('redirects to albums on successful folder addition', async () => {
      invoke.mockResolvedValueOnce(true)
      await askToAddFolder()
      await sleep(10)

      expect(invoke).toHaveBeenCalledWith('settings.addFolders')
      expect(location.hash).toBe('#/album')
    })

    it('does not redirect to albums on cancelled folder addition', async () => {
      invoke.mockResolvedValueOnce(false)
      await askToAddFolder()
      await sleep(10)

      expect(invoke).toHaveBeenCalledWith('settings.addFolders')
      expect(location.hash).toBe('#/')
    })

    it('can not add folders on browser', async () => {
      isDesktop.next(false)
      await expect(askToAddFolder()).rejects.toEqual(
        expect.objectContaining({
          message: 'Operation not supported on browser'
        })
      )
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
      const removed = faker.helpers.arrayElement(folders)
      await removeFolder(removed)

      expect(invoke).toHaveBeenCalledWith('settings.removeFolder', removed)
    })

    it('can save locale', async () => {
      const locale = faker.helpers.arrayElement(['en', 'fr'])
      await saveLocale(locale)

      expect(invoke).toHaveBeenCalledWith('settings.setLocale', locale)
    })

    it('can save AudioDB key', async () => {
      const key = faker.string.alphanumeric(10)
      await saveAudioDBKey(key)

      expect(invoke).toHaveBeenCalledWith('settings.setAudioDBKey', key)
    })

    it('can save Discogs token', async () => {
      const token = faker.string.uuid()
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
      const port = faker.number.int()
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
      initConnection.mockResolvedValueOnce(values)

      toggleBroadcast()
      await sleep(550)

      expect(get(connected)).toBe(true)
      expect(get(settings)).toEqual(values)

      expect(invoke).toHaveBeenCalledWith('settings.toggleBroadcast')
      expect(closeConnection).toHaveBeenCalledOnce()
      expect(initConnection).toHaveBeenCalledWith(
        `ws://localhost:${port}`,
        null,
        expect.any(Function),
        expect.any(Function)
      )
      expect(initConnection).toHaveBeenCalledTimes(2)

      isDesktop.next(false)
      await expect(toggleBroadcast()).rejects.toEqual(
        expect.objectContaining({
          message: 'Operation not supported on browser'
        })
      )
      expect(invoke).toHaveBeenCalledOnce()
    })

    it('retries connecting to new address when toggling broadcast', async () => {
      const values = {
        locale,
        folders,
        enqueueBehaviour,
        providers
      }
      initConnection
        .mockImplementationOnce(async (address, token, onConnectionLost) => {
          onConnectionLost()
        })
        .mockImplementationOnce(async (address, token, onConnectionLost) => {
          onConnectionLost()
        })
        .mockResolvedValueOnce(values)
      invoke.mockResolvedValueOnce(values)

      toggleBroadcast()
      await sleep(550)

      // will first fail, then retries
      expect(get(connected)).toBe(false)

      expect(invoke).toHaveBeenCalledWith('settings.toggleBroadcast')
      expect(invoke).toHaveBeenCalledOnce()
      expect(closeConnection).toHaveBeenCalledOnce()
      expect(initConnection).toHaveBeenNthCalledWith(
        2,
        `ws://localhost:${port}`,
        null,
        expect.any(Function),
        expect.any(Function)
      )
      expect(initConnection).toHaveBeenCalledTimes(2)

      await sleep(300)
      expect(get(connected)).toBe(true)
      expect(initConnection).toHaveBeenCalledTimes(4)
    })
  })

  describe('given not being on desktop', () => {
    const totpValue = faker.number.int().toString()
    const serverAddress = `${faker.internet.protocol()}://${faker.internet.ip()}:${port}`

    beforeEach(async () => {
      isDesktop.next(false)
    })

    it('handles invalid TOTP', async () => {
      fetch.mockResolvedValueOnce({ ok: false })
      init(serverAddress)
      expect(get(connected)).toBeNull()

      setTotp(totpValue)
      await sleep()
      expect(fetch).toHaveBeenCalledWith('/token', {
        method: 'POST',
        body: totpValue
      })
      expect(get(connected)).toBeNull()
      expect(get(totp)).toBeNull()
      expect(initConnection).not.toHaveBeenCalled()
    })

    it('connects with valid TOTP', async () => {
      const newToken = faker.string.uuid()
      fetch.mockResolvedValueOnce({ ok: true, text: async () => newToken })
      initConnection.mockResolvedValueOnce({
        locale,
        folders,
        enqueueBehaviour,
        providers
      })

      const totpValue = faker.number.int().toString()
      setTotp(totpValue)
      await sleep()
      expect(fetch).toHaveBeenCalledWith('/token', {
        method: 'POST',
        body: totpValue
      })
      expect(get(connected)).toBe(true)
      expect(get(totp)).toBeNull()
      expect(initConnection).toHaveBeenCalledWith(
        serverAddress,
        newToken,
        expect.any(Function),
        expect.any(Function)
      )
      expect(initConnection).toHaveBeenCalledOnce()
    })
  })
})
