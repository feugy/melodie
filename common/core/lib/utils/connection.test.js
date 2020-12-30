'use strict'

const { join } = require('path')
const { tmpdir } = require('os')
const { ensureDir, ensureFile } = require('fs-extra')
const WebSocket = require('ws')
const faker = require('faker')
const got = require('got').extend({
  timeout: 100,
  retry: 0,
  followRedirect: false
})
const publicIp = require('public-ip')
const { initConnection, broadcast, messageBus } = require('./connection')
const { getLogger } = require('./logger')
const { sleep, makeFolder } = require('../tests')

jest.mock('public-ip')

function connectWSClient(address) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(address.replace('http', 'ws'))
    ws.on('open', () => {
      ws.removeAllListeners('error')
      resolve(ws)
    })
    ws.on('error', reject)
  })
}

function waitWSClosure(ws) {
  return new Promise((resolve, reject) => {
    ws.on('close', () => {
      ws.removeAllListeners('error')
      resolve()
    })
    ws.on('error', reject)
  })
}

function call(ws, data) {
  ws.send(JSON.stringify(data))
}

function listen(ws) {
  return new Promise((resolve, reject) => {
    ws.on('error', reject)
    ws.on('message', data => {
      ws.removeAllListeners('error')
      try {
        resolve(JSON.parse(data))
      } catch (err) {
        reject(err)
      }
    })
  })
}

function callAndListen(ws, data) {
  const promise = listen(ws)
  call(ws, data)
  return promise
}

function waitUIAddress() {
  return new Promise(resolve => {
    messageBus.once('ui-address-set', resolve)
  })
}

describe('connection utilities', () => {
  let errorSpy
  let close
  let address
  let folder
  let tracks
  const publicFolder = join(tmpdir(), faker.random.word())
  const ip = faker.internet.ip()

  const services = {
    settings: { get: jest.fn() },
    media: { triggerArtistsEnrichment: jest.fn() }
  }

  beforeAll(async () => {
    await ensureDir(publicFolder)
    await ensureFile(join(publicFolder, 'index.html'))
    const created = await makeFolder({ fileNb: 5, depth: 2 })
    folder = created.folder
    tracks = created.files
  })

  beforeEach(() => {
    jest.resetAllMocks()
    publicIp.v4.mockResolvedValue(ip)
    errorSpy = jest
      .spyOn(getLogger('connection'), 'error')
      .mockImplementation(() => {})
    services.settings.get.mockResolvedValue({
      folders: [folder],
      isBroadcasting: false
    })
  })

  afterEach(() => (close ? close() : null))

  it('starts a WebSocket server and can stop it', async () => {
    const uiAddress = waitUIAddress()
    ;({ close, address } = await initConnection(services, publicFolder))
    expect(close).toBeInstanceOf(Function)
    expect(address).toInclude('127.0.0.1')

    const ws = await connectWSClient(address)
    expect(await uiAddress).toEqual(`http://${ip}:${address.split(':')[2]}`)

    await expect(got(`${address}/index.html`)).rejects.toThrow(/Not Found/)
    await expect(
      got.get(`${address}${tracks[0].path.replace(/\\/g, '/')}`)
    ).rejects.toThrow(/Not Found/)

    const promise = waitWSClosure(ws)
    close()
    await promise
    expect(errorSpy).not.toHaveBeenCalled()
    expect(publicIp.v4).toHaveBeenCalledTimes(1)
  })

  it('uses explicit port over settings', async () => {
    const broadcastPort = faker.random.number({ min: 2000, max: 4000 })
    const port = faker.random.number({ min: 5000, max: 8000 })
    services.settings.get.mockResolvedValueOnce({
      folders: [folder],
      isBroadcasting: false,
      broadcastPort
    })
    let uiAddress = waitUIAddress()

    ;({ close, address } = await initConnection(services, publicFolder))
    expect(close).toBeInstanceOf(Function)
    expect(address).toInclude(broadcastPort)
    expect(await uiAddress).toEqual(`http://${ip}:${broadcastPort}`)
    await close()

    uiAddress = waitUIAddress()
    ;({ close, address } = await initConnection(services, publicFolder, port))
    expect(close).toBeInstanceOf(Function)
    expect(address).toInclude(port)
    expect(await uiAddress).toEqual(`http://${ip}:${port}`)

    expect(errorSpy).not.toHaveBeenCalled()
    expect(publicIp.v4).toHaveBeenCalledTimes(2)
  })

  it('can start and stop broadcasting', async () => {
    const port = faker.random.number({ min: 9000, max: 10000 })
    const uiAddress = waitUIAddress()

    ;({ close, address } = await initConnection(services, publicFolder, port))
    expect(close).toBeInstanceOf(Function)
    expect(address).toInclude('127.0.0.1')
    expect(address).toInclude(`:${port}`)
    await expect(got(`${address}/index.html`)).rejects.toThrow(/Not Found/)

    expect(await uiAddress).toEqual(`http://${ip}:${port}`)

    broadcast('settings-saved', {
      folders: [folder],
      isBroadcasting: true
    })
    await sleep(150)
    expect(await got(`${address}/index.html`)).toBeDefined()

    broadcast('settings-saved', {
      folders: [folder],
      isBroadcasting: false
    })
    await sleep(150)
    await expect(got(`${address}/index.html`)).rejects.toThrow(/Not Found/)
  })

  it('can serve static files when broadcasting', async () => {
    services.settings.get.mockResolvedValueOnce({
      folders: [folder],
      isBroadcasting: true
    })
    ;({ close, address } = await initConnection(services, publicFolder))
    expect(address).toInclude('0.0.0.0')
    expect(await got.get(`${address}/index.html`)).toBeDefined()
    expect(
      await got.get(`${address}${tracks[0].path.replace(/\\/g, '/')}`)
    ).toBeDefined()
    expect(
      await got(`${address}/${tracks[1].path.replace(/\\/g, '/')}`)
    ).toBeDefined()
    await expect(got(`${address}/unknown.js`)).rejects.toThrow(/Not Found/)
  })

  it('can serve file from newly added folder', async () => {
    services.settings.get.mockResolvedValueOnce({
      folders: [],
      isBroadcasting: true
    })
    ;({ close, address } = await initConnection(services, publicFolder))
    expect(await got.get(`${address}/index.html`)).toBeDefined()
    await expect(
      got.get(`${address}${tracks[0].path.replace(/\\/g, '/')}`)
    ).rejects.toThrow(/Not Found/)

    broadcast('settings-saved', { folders: [folder], isBroadcasting: true })
    expect(await got.get(`${address}/index.html`)).toBeDefined()
    expect(
      await got(`${address}/${tracks[0].path.replace(/\\/g, '/')}`)
    ).toBeDefined()
  })

  it('stops serving files from removed folder', async () => {
    services.settings.get.mockResolvedValueOnce({
      folders: [folder],
      isBroadcasting: true
    })
    ;({ close, address } = await initConnection(services, publicFolder))
    expect(await got.get(`${address}/index.html`)).toBeDefined()
    expect(
      await got(`${address}/${tracks[0].path.replace(/\\/g, '/')}`)
    ).toBeDefined()

    broadcast('settings-saved', { folders: [], isBroadcasting: true })
    expect(await got.get(`${address}/index.html`)).toBeDefined()
    await expect(
      got.get(`${address}${tracks[0].path.replace(/\\/g, '/')}`)
    ).rejects.toThrow(/Not Found/)
  })

  it('throws when initializing connection twice', async () => {
    close = (await initConnection(services, publicFolder)).close
    expect(initConnection(services, publicFolder)).rejects.toThrow(
      `connection already started, stop it first`
    )
  })

  it('can invoke a service function', async () => {
    ;({ close, address } = await initConnection(services, publicFolder))
    const result = { foo: faker.lorem.words() }
    services.media.triggerArtistsEnrichment.mockResolvedValueOnce(result)
    const ws = await connectWSClient(address)
    const invoked = 'media.triggerArtistsEnrichment'
    const args = faker.random.arrayElements()
    const id = faker.random.uuid()

    expect(await callAndListen(ws, { invoked, args, id })).toEqual({
      id,
      result
    })
    expect(services.media.triggerArtistsEnrichment).toHaveBeenCalledWith(
      ...args
    )
    expect(services.media.triggerArtistsEnrichment).toHaveBeenCalledTimes(1)
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('returns error on unknown module', async () => {
    ;({ close, address } = await initConnection(services, publicFolder))
    const ws = await connectWSClient(address)
    const name = 'whatever'
    const fn = 'triggerArtistsEnrichment'
    const invoked = `${name}.${fn}`
    const args = faker.random.arrayElements()
    const id = faker.random.uuid()

    expect(await callAndListen(ws, { invoked, args, id })).toEqual({
      id,
      error: `core doesn't support ${name}.${fn}()`
    })
    expect(errorSpy).toHaveBeenCalledWith(
      { data: { invoked, args, id }, err: expect.any(Error) },
      `core doesn't support ${name}.${fn}()`
    )
  })

  it('returns error on unknown function', async () => {
    ;({ close, address } = await initConnection(services, publicFolder))
    const ws = await connectWSClient(address)
    const name = 'media'
    const fn = 'whatever'
    const invoked = `${name}.${fn}`
    const args = faker.random.arrayElements()
    const id = faker.random.uuid()

    expect(await callAndListen(ws, { invoked, args, id })).toEqual({
      id,
      error: `core doesn't support ${name}.${fn}()`
    })
    expect(errorSpy).toHaveBeenCalledWith(
      { data: { invoked, args, id }, err: expect.any(Error) },
      `core doesn't support ${name}.${fn}()`
    )
  })

  it('returns error from invoked function', async () => {
    ;({ close, address } = await initConnection(services, publicFolder))
    const err = new Error('boom!')
    services.media.triggerArtistsEnrichment.mockRejectedValueOnce(err)
    const ws = await connectWSClient(address)
    const invoked = `media.triggerArtistsEnrichment`
    const args = faker.random.arrayElements()
    const id = faker.random.uuid()

    expect(await callAndListen(ws, { invoked, args, id })).toEqual({
      id,
      error: err.message
    })
    expect(errorSpy).toHaveBeenCalledWith(
      { data: { invoked, args, id }, err },
      err.message
    )
  })

  it('logs warning on unsupported message', async () => {
    ;({ close, address } = await initConnection(services, publicFolder))
    const ws = await connectWSClient(address)

    const data = { foo: faker.random.word() }
    call(ws, data)
    await sleep(10)

    expect(errorSpy).toHaveBeenCalledWith(
      { data, reason: expect.any(String) },
      `unsupported message received`
    )
  })

  it('logs warning on unparseable message', async () => {
    ;({ close, address } = await initConnection(services, publicFolder))
    const ws = await connectWSClient(address)

    const rawData = 'does not parse to JSON'
    ws.send(rawData)
    await sleep(10)

    expect(errorSpy).toHaveBeenCalledWith(
      { rawData },
      `unparseable message: Unexpected token d in JSON at position 0`
    )
  })

  it('logs UI errors', async () => {
    const data = { error: 'for testing!', lineno: 10, colno: 153 }
    ;({ close, address } = await initConnection(services, publicFolder))
    const ws = await connectWSClient(address)

    call(ws, data)
    await sleep(10)
    expect(errorSpy).toHaveBeenCalledWith(data, `UI error: ${data.error}`)
  })

  it('broadcast external and internal messages', async () => {
    const event = faker.random.word()
    ;({ close, address } = await initConnection(services, publicFolder))
    const listener = jest.fn()
    const ws1 = await connectWSClient(address)
    const ws2 = await connectWSClient(address)
    const p1 = listen(ws1)
    const p2 = listen(ws2)
    messageBus.on(event, listener)

    const args = { foo: faker.lorem.word() }
    broadcast(event, args)
    expect(await Promise.all([p1, p2])).toEqual([
      { event, args },
      { event, args }
    ])
    expect(listener).toHaveBeenCalledWith(args)
    expect(listener).toHaveBeenCalledTimes(1)

    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('throws error when broadcasting without connection', async () => {
    expect(() => broadcast(faker.random.word(), {})).toThrow(
      `unstarted connection, call subscribeRemote() first`
    )
    expect(errorSpy).not.toHaveBeenCalled()
  })
})
