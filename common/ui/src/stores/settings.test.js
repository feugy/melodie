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
    it('handles connection failure, loads settings on success, and retries on lost connection', async () => {
      // default state
      expect(get(isDesktop)).toBeTrue()
      expect(get(settings)).toEqual({
        enqueueBehaviour: {},
        isBroadcasting: false,
        providers: { audiodb: {}, discogs: {} }
      })
      expect(get(connected)).toEqual(false)

      const url = `${faker.internet.protocol()}://${faker.internet.ip()}:${port}`
      const values = {
        locale,
        folders,
        enqueueBehaviour,
        providers
      }
      invoke.mockResolvedValue(values)
      const err = new Error('Connection error')

      // failure
      initConnection.mockRejectedValueOnce(err)
      await init(url)

      expect(get(connected)).toEqual(false)
      expect(get(settings)).toEqual({
        enqueueBehaviour: {},
        isBroadcasting: false,
        providers: { audiodb: {}, discogs: {} }
      })
      expect(initConnection).toHaveBeenCalledWith(url, expect.any(Function))
      expect(initConnection).toHaveBeenCalledTimes(1)
      expect(invoke).not.toHaveBeenCalled()

      // success
      initConnection.mockResolvedValueOnce()
      await init(url)

      expect(get(connected)).toEqual(true)
      expect(get(settings)).toEqual(values)
      expect(initConnection).toHaveBeenCalledWith(url, expect.any(Function))
      expect(initConnection).toHaveBeenCalledTimes(2)
      expect(invoke).toHaveBeenCalledTimes(1)

      // run the connection lost callback
      initConnection
        .mockRejectedValueOnce(err)
        .mockRejectedValueOnce(err)
        .mockResolvedValueOnce()
        .mock.calls[1][1]()

      await sleep(50)
      expect(get(connected)).toEqual(false)

      await sleep(300)
      expect(get(connected)).toEqual(true)
      expect(get(settings)).toEqual(values)
      expect(initConnection).toHaveBeenCalledTimes(5)
    })
  })

  describe('given initialization', () => {
    beforeEach(async () => {
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
      initConnection.mockResolvedValueOnce()
      invoke.mockResolvedValueOnce(values)

      toggleBroadcast()
      await sleep(50)

      expect(get(connected)).toEqual(true)
      expect(get(settings)).toEqual(values)

      expect(invoke).toHaveBeenCalledWith('settings.toggleBroadcast')
      expect(closeConnection).toHaveBeenCalledTimes(1)
      expect(initConnection).toHaveBeenCalledWith(
        `ws://localhost:${port}`,
        expect.any(Function)
      )
      expect(initConnection).toHaveBeenCalledTimes(1)

      isDesktop.next(false)
      await expect(toggleBroadcast()).rejects.toThrow(/not supported/)
      expect(invoke).toHaveBeenCalledTimes(1)
    })

    it('retries connecting to new address when toggling broadcast', async () => {
      const err = new Error('Connection error')
      const values = {
        locale,
        folders,
        enqueueBehaviour,
        providers
      }
      initConnection
        .mockRejectedValueOnce(err)
        .mockRejectedValueOnce(err)
        .mockResolvedValueOnce()
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
        expect.any(Function)
      )
      expect(initConnection).toHaveBeenCalledTimes(1)

      await sleep(300)
      expect(get(connected)).toEqual(true)
      expect(initConnection).toHaveBeenCalledTimes(3)
    })
  })
})
