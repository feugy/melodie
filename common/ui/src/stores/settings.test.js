'use strict'

import { get } from 'svelte/store'
import faker from 'faker'
import { invoke } from '../utils'
import { sleep } from '../tests'

describe('settings store', () => {
  let settings
  let askToAddFolder
  let removeFolder
  let saveAudioDBKey
  let saveDiscogsToken
  let saveEnqueueBehaviour
  let saveLocale
  let init
  const locale = 'en'
  const key = faker.random.alphaNumeric(10)
  const token = faker.random.uuid()
  const providers = { audiodb: { key }, discogs: { token } }
  const enqueueBehaviour = { onClick: true, clearBefore: false }
  const folders = [faker.system.fileName(), faker.system.fileName()]

  beforeAll(async () => {
    ;({
      init,
      settings,
      askToAddFolder,
      removeFolder,
      saveAudioDBKey,
      saveDiscogsToken,
      saveEnqueueBehaviour,
      saveLocale
    } = await import('./settings'))
  })

  beforeEach(() => {
    location.hash = `#/`
    jest.resetAllMocks()
  })

  it('has loaded settings on init', async () => {
    expect(get(settings)).toEqual({
      enqueueBehaviour: {},
      providers: { audiodb: {}, discogs: {} }
    })

    invoke.mockResolvedValueOnce({
      locale,
      folders,
      enqueueBehaviour,
      providers
    })
    await init()

    expect(get(settings)).toEqual({
      locale,
      folders,
      enqueueBehaviour,
      providers
    })
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
    const token = faker.random.uuid()
    await saveDiscogsToken(token)

    expect(invoke).toHaveBeenCalledWith('settings.setDiscogsToken', token)
  })

  it('can save enqueue behaviour', async () => {
    const onClick = faker.random.boolean()
    const clearBefore = faker.random.boolean()
    await saveEnqueueBehaviour({ onClick, clearBefore })

    expect(invoke).toHaveBeenCalledWith('settings.setEnqueueBehaviour', {
      onClick,
      clearBefore
    })
  })
})
