'use strict'

import { first, timeout } from 'rxjs/operators'
import { get } from 'svelte/store'
import faker from 'faker'
import WebSocket from 'ws'
import { sleep } from '../tests'
const {
  closeConnection,
  enhanceUrl,
  fromServerEvent,
  initConnection,
  invoke,
  lastInvokation,
  send
} = jest.requireActual('./connection')

describe('connection utilities', () => {
  let server
  let serverUrl
  let errorSpy
  let handleLostConnection
  let handleNewToken
  let handleUpgrade
  const webSocketSave = window.WebSocket
  const token = faker.datatype.uuid()
  const settings = { folders: [faker.system.directoryPath()] }

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

  function setServerUpgrade(handleUpgrade) {
    const messageByCode = {
      401: 'Unauthorized',
      403: 'Forbidden'
    }
    server._server.removeAllListeners('upgrade')
    server._server.on('upgrade', async (request, socket, head) => {
      const code = await handleUpgrade(
        Object.fromEntries(
          new URL(request.url, 'http://localhost').searchParams.entries()
        )
      )
      if (code) {
        socket.write(`HTTP/1.1 ${code} ${messageByCode[code]}'}\r\n\r\n`)
        socket.destroy()
      } else {
        server.handleUpgrade(request, socket, head, ws =>
          server.emit('connection', ws, request)
        )
      }
    })
  }

  beforeEach(async () => {
    jest.resetAllMocks()
    window.WebSocket = webSocketSave
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    handleLostConnection = jest.fn()
    handleNewToken = jest.fn()
    server = new WebSocket.Server({ port: 0 })
    handleUpgrade = jest.fn().mockResolvedValue(null)
    await new Promise((resolve, reject) => {
      server.on('error', reject)
      server.on('listening', resolve)
    })
    server.on('connection', ws => ws.send(JSON.stringify({ token, settings })))
    setServerUpgrade(handleUpgrade)
    serverUrl = `ws://localhost:${server.address().port}`
    sessionStorage.clear()
  })

  afterEach(() => {
    closeConnection()
    for (const ws of server.clients) {
      ws.terminate()
    }
    server.close()
  })

  it('returns null when enhancing falsy url', () => {
    expect(enhanceUrl()).toBeNull()
    expect(enhanceUrl(null)).toBeNull()
    expect(enhanceUrl(false)).toBeNull()
    expect(enhanceUrl(0)).toBeNull()
  })

  it('returns null when enhancing url without connection', () => {
    expect(enhanceUrl('/media/1')).toBeNull()
  })

  it('connects to WebSocket server and can disconnect', async () => {
    const [response, client] = await Promise.all([
      initConnection(serverUrl, token, handleLostConnection, handleNewToken),
      new Promise(resolve => server.on('connection', resolve))
    ])
    expect(response).toEqual(settings)
    expect(handleUpgrade).toHaveBeenCalledWith({ token })
    expect(handleNewToken).toHaveBeenCalledWith(token)

    const closure = new Promise(resolve => client.on('close', resolve))
    closeConnection()
    await closure
    expect(errorSpy).not.toHaveBeenCalled()
    expect(handleLostConnection).not.toHaveBeenCalled()
    expect(get(lastInvokation)).toBeUndefined()
    expect(handleNewToken).toHaveBeenCalledTimes(1)
  })

  it('throws when initializing connection twice', async () => {
    expect(
      await initConnection(
        serverUrl,
        token,
        handleLostConnection,
        handleNewToken
      )
    ).toEqual(settings)
    await expect(
      initConnection(serverUrl, token, handleLostConnection)
    ).rejects.toThrow(/connection already established, close it first/)
    expect(errorSpy).not.toHaveBeenCalled()
    expect(handleLostConnection).not.toHaveBeenCalled()
    expect(handleNewToken).toHaveBeenCalledTimes(1)
  })

  it('invokes error callback when server throws an error', async () => {
    window.WebSocket = function () {
      throw new Error('boom!')
    }
    expect(
      await initConnection(
        serverUrl,
        token,
        handleLostConnection,
        handleNewToken
      )
    ).toBeNull()
    expect(errorSpy).not.toHaveBeenCalled()
    expect(handleLostConnection).toHaveBeenCalledTimes(1)
    expect(handleLostConnection).toHaveBeenCalledWith(
      new Error('failed to establish connection: boom!')
    )
    expect(handleNewToken).not.toHaveBeenCalled()
  })

  it('invokes error callback when connecting to unavailable server', async () => {
    server.close()
    expect(
      await initConnection(
        serverUrl,
        token,
        handleLostConnection,
        handleNewToken
      )
    ).toBeNull()
    expect(errorSpy).not.toHaveBeenCalled()
    expect(handleLostConnection).toHaveBeenCalledTimes(1)
    expect(handleLostConnection).toHaveBeenCalledWith(
      new Error('failed to establish connection')
    )
    expect(handleNewToken).not.toHaveBeenCalled()
  })

  it('invokes error callback when connecting with invalid token', async () => {
    setServerUpgrade(() => 401)
    expect(
      await initConnection(
        serverUrl,
        token,
        handleLostConnection,
        handleNewToken
      )
    ).toBeNull()
    expect(errorSpy).not.toHaveBeenCalled()
    expect(handleLostConnection).toHaveBeenCalledTimes(1)
    expect(handleLostConnection).toHaveBeenCalledWith(
      new Error('failed to establish connection')
    )
    expect(handleNewToken).not.toHaveBeenCalled()
  })

  it('invokes error callback when failing to receive token from server', async () => {
    const data = 'unparseable'
    const error = new Error(
      'Failed to receive token from server: Unexpected token u in JSON at position 0'
    )
    server.removeAllListeners('connection')
    server.on('connection', ws => ws.send(data))
    expect(
      await initConnection(
        serverUrl,
        token,
        handleLostConnection,
        handleNewToken
      )
    ).toBeNull()
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalledWith(error, data)
    expect(handleLostConnection).toHaveBeenCalledWith(error)
    expect(handleNewToken).not.toHaveBeenCalled()
  })

  it('invokes error callback when server denied connection for missing token', async () => {
    setServerUpgrade(() => 403)
    expect(
      await initConnection(
        serverUrl,
        null,
        handleLostConnection,
        handleNewToken
      )
    ).toBeNull()
    expect(errorSpy).not.toHaveBeenCalled()
    expect(handleLostConnection).toHaveBeenCalledWith(
      new Error('failed to establish connection')
    )
    expect(handleNewToken).not.toHaveBeenCalled()
  })

  it('invokes error callback after some time on unresponsive server', async () => {
    setServerUpgrade(() => sleep(8000))
    expect(
      await initConnection(
        serverUrl,
        token,
        handleLostConnection,
        handleNewToken
      )
    ).toBeNull()
    expect(errorSpy).not.toHaveBeenCalled()
    expect(handleLostConnection).toHaveBeenCalledWith(
      new Error('failed to establish connection: timeout')
    )
    expect(handleNewToken).not.toHaveBeenCalled()
  }, 3000)

  it('throws an error when invoking function without connection', async () => {
    await expect(invoke('media.test')).rejects.toThrow(
      'unestablished connection, call initConnection() first'
    )
    expect(errorSpy).not.toHaveBeenCalled()
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
    await initConnection(serverUrl, token, handleLostConnection, handleNewToken)
    expect(handleLostConnection).not.toHaveBeenCalled()

    for (const ws of server.clients) {
      ws.terminate()
    }
    await sleep(10)
    expect(handleLostConnection).toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
    expect(handleNewToken).toHaveBeenCalledWith(token)
    expect(handleNewToken).toHaveBeenCalledTimes(1)
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
    await initConnection(serverUrl, token, handleLostConnection, handleNewToken)

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
    expect(handleNewToken).toHaveBeenCalledWith(token)
    expect(handleNewToken).toHaveBeenCalledTimes(1)
  })

  it('can receive fresh token', async () => {
    const newToken = faker.datatype.uuid()
    let ws
    server.on('connection', client => {
      ws = client
    })
    await initConnection(serverUrl, token, handleLostConnection, handleNewToken)
    expect(handleNewToken).toHaveBeenNthCalledWith(1, token)

    ws.send(JSON.stringify({ token: newToken }))
    await sleep()
    expect(errorSpy).not.toHaveBeenCalled()
    expect(handleLostConnection).not.toHaveBeenCalled()
    expect(handleNewToken).toHaveBeenNthCalledWith(2, newToken)
    expect(handleNewToken).toHaveBeenCalledTimes(2)
  })

  it('warns unsupported message from server', async () => {
    const delay = 10
    const event = faker.random.word()
    const data = 'does not parse as JSON'

    let ws
    server.on('connection', client => {
      ws = client
    })
    await initConnection(serverUrl, token, handleLostConnection, handleNewToken)

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
    expect(handleNewToken).toHaveBeenCalledWith(token)
    expect(handleNewToken).toHaveBeenCalledTimes(1)
  })

  describe('given a connection', () => {
    const handleMessage = jest.fn()
    beforeEach(async () => {
      setServerResponse(handleMessage)
      await initConnection(
        serverUrl,
        token,
        handleLostConnection,
        handleNewToken
      )
    })

    it('can enhance urls', () => {
      expect(enhanceUrl('/media/1')).toBe(
        `${serverUrl.replace('ws', 'http')}/media/1?token=${token}`
      )
      expect(enhanceUrl('/media?path=test')).toBe(
        `${serverUrl.replace('ws', 'http')}/media?path=test&token=${token}`
      )
    })

    it('can invoke a service function', async () => {
      const result = { foo: faker.random.word() }
      handleMessage.mockResolvedValueOnce({ result })
      const invoked = 'media.triggerArtistsEnrichment'
      const args = faker.random.arrayElements()
      expect(get(lastInvokation)).toBeUndefined()
      expect(await invoke(invoked, ...args)).toEqual(result)
      expect(get(lastInvokation)).toEqual({
        invoked,
        args,
        id: expect.any(String)
      })
      expect(handleMessage).toHaveBeenCalledWith({
        invoked,
        args,
        token,
        id: expect.any(String)
      })
      expect(handleMessage).toHaveBeenCalledTimes(1)
      expect(errorSpy).not.toHaveBeenCalled()
      expect(handleLostConnection).not.toHaveBeenCalled()
    })

    it('supports a service function with no results', async () => {
      handleMessage.mockResolvedValueOnce({})
      const invoked = 'media.triggerArtistsEnrichment'
      const args = faker.random.arrayElements()
      expect(await invoke(invoked, ...args)).toBeUndefined()
      expect(handleMessage).toHaveBeenCalledWith({
        invoked,
        args,
        token,
        id: expect.any(String)
      })
      expect(handleMessage).toHaveBeenCalledTimes(1)
      expect(errorSpy).not.toHaveBeenCalled()
      expect(handleLostConnection).not.toHaveBeenCalled()
    })

    it('supports a service function throwing error', async () => {
      const error = 'boom!'
      handleMessage.mockResolvedValueOnce({ error })
      const invoked = 'media.triggerArtistsEnrichment'
      const args = faker.random.arrayElements()
      await expect(invoke(invoked, ...args)).rejects.toThrow(error)
      expect(handleMessage).toHaveBeenCalledWith({
        invoked,
        args,
        token,
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
      handleMessage.mockImplementation(async ({ args }) => {
        if (args[0] === args1[0]) {
          await sleep(10)
          return { result: result1 }
        } else {
          return { result: result2 }
        }
      })

      const invoked = 'media.triggerArtistsEnrichment'
      const call1 = invoke(invoked, ...args1)
      const call2 = invoke(invoked, ...args2)
      expect(await Promise.all([call1, call2])).toEqual([result1, result2])
      expect(handleMessage).toHaveBeenNthCalledWith(1, {
        invoked,
        args: args1,
        token,
        id: expect.any(String)
      })
      expect(handleMessage).toHaveBeenNthCalledWith(2, {
        invoked,
        args: args2,
        token,
        id: expect.any(String)
      })
      expect(handleMessage).toHaveBeenCalledTimes(2)
      expect(errorSpy).not.toHaveBeenCalled()
      expect(handleLostConnection).not.toHaveBeenCalled()
    })
  })
})
