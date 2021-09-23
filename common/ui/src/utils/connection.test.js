'use strict'

import { first, timeout } from 'rxjs/operators'
import faker from 'faker'
import WebSocket from 'ws'
import { sleep } from '../tests'
const { closeConnection, fromServerEvent, initConnection, invoke, send } =
  jest.requireActual('./connection')

describe('connection utilities', () => {
  let server
  let serverUrl
  let errorSpy
  let handleLostConnection

  function setServerResponse(handleMessage) {
    server.on('connection', client => {
      client.on('message', rawData => {
        const data = JSON.parse(rawData)
        handleMessage(data).then(response =>
          client.send(JSON.stringify({ id: data.id, ...response }))
        )
      })
    })
  }

  beforeEach(async () => {
    jest.resetAllMocks()
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    handleLostConnection = jest.fn()
    server = new WebSocket.Server({ port: 0 })
    await new Promise((resolve, reject) => {
      server.on('error', reject)
      server.on('listening', resolve)
    })
    serverUrl = `ws://localhost:${server.address().port}/ws`
  })

  afterEach(() => {
    closeConnection()
    for (const ws of server.clients) {
      ws.terminate()
    }
  })

  it('connects to WebSocket server and can disconnect', async () => {
    const connection = new Promise(resolve => server.on('connection', resolve))
    await initConnection(serverUrl, handleLostConnection)
    const client = await connection

    const closure = new Promise(resolve => client.on('close', resolve))
    closeConnection()
    await closure
    expect(errorSpy).not.toHaveBeenCalled()
    expect(handleLostConnection).not.toHaveBeenCalled()
  })

  it('throws when initializing connection twice', async () => {
    await initConnection(serverUrl, handleLostConnection)
    await expect(
      initConnection(serverUrl, handleLostConnection)
    ).rejects.toThrow(/connection already established, close it first/)
    expect(errorSpy).not.toHaveBeenCalled()
    expect(handleLostConnection).not.toHaveBeenCalled()
  })

  it('throws when server is not available', async () => {
    server.close()
    await expect(
      initConnection(serverUrl, handleLostConnection)
    ).rejects.toThrow(/failed to establish connection/)
    expect(errorSpy).not.toHaveBeenCalled()
    expect(handleLostConnection).not.toHaveBeenCalled()
  })

  it('can invoke a service function', async () => {
    const result = { foo: faker.random.word() }
    const handleMessage = jest.fn().mockResolvedValueOnce({ result })
    setServerResponse(handleMessage)

    const invoked = 'media.triggerArtistsEnrichment'
    const args = faker.random.arrayElements()
    await initConnection(serverUrl, handleLostConnection)
    expect(await invoke(invoked, ...args)).toEqual(result)
    expect(handleMessage).toHaveBeenCalledWith({
      invoked,
      args,
      id: expect.any(String)
    })
    expect(handleMessage).toHaveBeenCalledTimes(1)
    expect(errorSpy).not.toHaveBeenCalled()
    expect(handleLostConnection).not.toHaveBeenCalled()
  })

  it('supports a service function with no results', async () => {
    const handleMessage = jest.fn().mockResolvedValueOnce({})
    setServerResponse(handleMessage)

    const invoked = 'media.triggerArtistsEnrichment'
    const args = faker.random.arrayElements()
    await initConnection(serverUrl, handleLostConnection)
    expect(await invoke(invoked, ...args)).toBeUndefined()
    expect(handleMessage).toHaveBeenCalledWith({
      invoked,
      args,
      id: expect.any(String)
    })
    expect(handleMessage).toHaveBeenCalledTimes(1)
    expect(errorSpy).not.toHaveBeenCalled()
    expect(handleLostConnection).not.toHaveBeenCalled()
  })

  it('supports a service function throwing error', async () => {
    const error = 'boom!'
    const handleMessage = jest.fn().mockResolvedValueOnce({ error })
    setServerResponse(handleMessage)

    const invoked = 'media.triggerArtistsEnrichment'
    const args = faker.random.arrayElements()
    await initConnection(serverUrl, handleLostConnection)
    await expect(invoke(invoked, ...args)).rejects.toThrow(error)
    expect(handleMessage).toHaveBeenCalledWith({
      invoked,
      args,
      id: expect.any(String)
    })
    expect(handleMessage).toHaveBeenCalledTimes(1)
    expect(errorSpy).not.toHaveBeenCalled()
    expect(handleLostConnection).not.toHaveBeenCalled()
  })

  it('does not mix parallel calls', async () => {
    const args1 = [1]
    const args2 = [2]
    const result1 = { foo: 'result 1' }
    const result2 = { foo: 'result 2' }
    const handleMessage = jest.fn().mockImplementation(async ({ args }) => {
      if (args[0] === args1[0]) {
        await sleep(10)
        return { result: result1 }
      } else {
        return { result: result2 }
      }
    })

    setServerResponse(handleMessage)

    const invoked = 'media.triggerArtistsEnrichment'
    await initConnection(serverUrl, handleLostConnection)

    const call1 = invoke(invoked, ...args1)
    const call2 = invoke(invoked, ...args2)
    expect(await Promise.all([call1, call2])).toEqual([result1, result2])
    expect(handleMessage).toHaveBeenNthCalledWith(1, {
      invoked,
      args: args1,
      id: expect.any(String)
    })
    expect(handleMessage).toHaveBeenNthCalledWith(2, {
      invoked,
      args: args2,
      id: expect.any(String)
    })
    expect(handleMessage).toHaveBeenCalledTimes(2)
    expect(errorSpy).not.toHaveBeenCalled()
    expect(handleLostConnection).not.toHaveBeenCalled()
  })

  it('throws an error when invoking function without connection', async () => {
    await expect(invoke('media.test')).rejects.toThrow(
      'unestablished connection, call initConnection() first'
    )
    expect(errorSpy).not.toHaveBeenCalled()
    expect(handleLostConnection).not.toHaveBeenCalled()
  })

  it('can receive server events', async () => {
    const delay = 10
    const args = { foo: faker.random.word() }
    const event1 = faker.random.word()
    const event2 = faker.random.word()
    let ws
    server.on('connection', client => {
      ws = client
    })
    await initConnection(serverUrl, handleLostConnection)

    const fromEvent1 = fromServerEvent(event1)
      .pipe(first(), timeout(delay))
      .toPromise()
    const fromEvent2 = fromServerEvent(event2)
      .pipe(first(), timeout(delay))
      .toPromise()
    const fromEvent12 = fromServerEvent(event1)
      .pipe(first(), timeout(delay))
      .toPromise()

    ws.send(JSON.stringify({ event: event1, args }))

    expect(await Promise.all([fromEvent1, fromEvent12])).toEqual([args, args])
    await expect(fromEvent2).rejects.toThrow(/Timeout has occurred/)
    expect(errorSpy).not.toHaveBeenCalled()
    expect(handleLostConnection).not.toHaveBeenCalled()
  })

  it('warns unsupported message from server', async () => {
    const delay = 10
    const event = faker.random.word()
    const data = 'does not parse as JSON'

    let ws
    server.on('connection', client => {
      ws = client
    })

    await initConnection(serverUrl, handleLostConnection)
    const fromEvent = fromServerEvent(event)
      .pipe(first(), timeout(delay))
      .toPromise()

    ws.send(data)

    await expect(fromEvent).rejects.toThrow(/Timeout has occurred/)
    expect(errorSpy).toHaveBeenCalledWith(
      `Failed to read server message: Unexpected token d in JSON at position 0`,
      expect.any(Error),
      data
    )
    expect(handleLostConnection).not.toHaveBeenCalled()
  })

  it('throws error when sending data without a connection', async () => {
    expect(() => send('test')).toThrowError(
      new Error(`unestablished connection, call initConnection() first`)
    )
  })

  it('can skip throwing error when sending data without a connection', async () => {
    expect(() => send('test', false)).not.toThrow()
  })

  it('closes and invokes callback on connection lost', async () => {
    await initConnection(serverUrl, handleLostConnection)
    expect(handleLostConnection).not.toHaveBeenCalled()

    for (const ws of server.clients) {
      ws.terminate()
    }
    await sleep(10)
    expect(handleLostConnection).toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
  })
})
