'use strict'

const { join } = require('path')
const { tmpdir } = require('os')
const { ensureDir } = require('fs-extra')
const WebSocket = require('ws')
const faker = require('faker')
const { initConnection, broadcast } = require('./connection')
const { getLogger } = require('./logger')
const { sleep } = require('../tests')

async function connectWSClient(address) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(address.replace('http', 'ws'))
    ws.on('open', () => {
      ws.removeAllListeners('error')
      resolve(ws)
    })
    ws.on('error', reject)
  })
}

async function waitWSClosure(ws) {
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

async function listen(ws) {
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

async function callAndListen(ws, data) {
  const promise = listen(ws)
  call(ws, data)
  return promise
}

describe('connection utilities', () => {
  let errorSpy
  let close
  let address
  const publicFolder = join(tmpdir(), faker.random.word())

  const services = {
    settings: { get: jest.fn() },
    media: { triggerArtistsEnrichment: jest.fn() }
  }

  beforeAll(() => ensureDir(publicFolder))

  beforeEach(() => {
    jest.resetAllMocks()
    errorSpy = jest
      .spyOn(getLogger('connection'), 'error')
      .mockImplementation(() => {})
    services.settings.get.mockResolvedValueOnce({ folders: [] })
  })

  afterEach(() => (close ? close() : null))

  it('starts a WebSocket server and can stop it', async () => {
    ;({ close, address } = await initConnection(services, publicFolder, 0))
    expect(close).toBeInstanceOf(Function)

    const ws = await connectWSClient(address)

    const promise = waitWSClosure(ws)
    close()
    await promise
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('throws when initializing connection twice', async () => {
    close = (await initConnection(services, publicFolder, 0)).close
    expect(initConnection(services, publicFolder, 0)).rejects.toThrow(
      `connection already started, stop it first`
    )
  })

  it('can invoke a service function', async () => {
    ;({ close, address } = await initConnection(services, publicFolder, 0))
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
    ;({ close, address } = await initConnection(services, publicFolder, 0))
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
    ;({ close, address } = await initConnection(services, publicFolder, 0))
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
    ;({ close, address } = await initConnection(services, publicFolder, 0))
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
    ;({ close, address } = await initConnection(services, publicFolder, 0))
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
    ;({ close, address } = await initConnection(services, publicFolder, 0))
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
    ;({ close, address } = await initConnection(services, publicFolder, 0))
    const ws = await connectWSClient(address)

    call(ws, data)
    await sleep(10)
    expect(errorSpy).toHaveBeenCalledWith(data, `UI error: ${data.error}`)
  })

  it('broadcast messages', async () => {
    ;({ close, address } = await initConnection(services, publicFolder, 0))
    const ws1 = await connectWSClient(address)
    const ws2 = await connectWSClient(address)
    const p1 = listen(ws1)
    const p2 = listen(ws2)

    const args = { foo: faker.lorem.word() }
    const event = faker.random.word()
    broadcast(event, args)
    expect(await Promise.all([p1, p2])).toEqual([
      { event, args },
      { event, args }
    ])

    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('throws error when broadcasting without connection', async () => {
    expect(() => broadcast(faker.random.word(), {})).toThrow(
      `unstarted connection, call subscribeRemote() first`
    )
    expect(errorSpy).not.toHaveBeenCalled()
  })
})
