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
  send,
  sendLogs
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
  const fetch = jest.spyOn(global, 'fetch')

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

  function setConnectionMessage(getConnectionData) {
    server.removeAllListeners('connection')
    server.once('connection', async (ws, { url }) => {
      handleUpgrade(
        new URL(url, 'http://example.com').searchParams.get('token')
      )
      ws.send(JSON.stringify(await getConnectionData()))
    })
  }

  beforeEach(async () => {
    jest.resetAllMocks()
    window.WebSocket = webSocketSave
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    handleLostConnection = jest.fn()
    handleNewToken = jest.fn()
    handleUpgrade = jest.fn()
    server = new WebSocket.Server({ port: 0 })
    await new Promise((resolve, reject) => {
      server.on('error', reject)
      server.on('listening', resolve)
    })
    setConnectionMessage(() => ({ token, settings }))
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

  describe('enhanceUrl()', () => {
    it('returns null when enhancing falsy url', () => {
      expect(enhanceUrl()).toBeNull()
      expect(enhanceUrl(null)).toBeNull()
      expect(enhanceUrl(false)).toBeNull()
      expect(enhanceUrl(0)).toBeNull()
    })

    it('returns null when enhancing url without connection', () => {
      expect(enhanceUrl('/media/1')).toBeNull()
    })
  })

  describe('initConnection()', () => {
    it('connects to WebSocket server and can disconnect', async () => {
      const [response, client] = await Promise.all([
        initConnection(serverUrl, token, handleLostConnection, handleNewToken),
        new Promise(resolve => server.on('connection', resolve))
      ])
      expect(response).toEqual(settings)
      expect(handleUpgrade).toHaveBeenCalledWith(token)
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
      expect(handleLostConnection).toHaveBeenCalledWith(new Error('boom!'))
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
        new Error('Failed to establish connection')
      )
      expect(handleNewToken).not.toHaveBeenCalled()
    })

    it('invokes error callback when connecting with invalid token', async () => {
      setConnectionMessage(() => ({ error: 'Invalid token', code: 403 }))
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
        new Error('Failed to establish connection: Invalid token')
      )
      expect(handleNewToken).toHaveBeenCalledWith(null)
      expect(handleNewToken).toHaveBeenCalledTimes(1)
    })

    it('invokes error callback when failing to receive token from server', async () => {
      const data = 'unparseable'
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
      expect(handleLostConnection).toHaveBeenCalledWith(
        new Error(
          'Failed to establish connection: Unexpected token u in JSON at position 0'
        )
      )
      expect(handleNewToken).not.toHaveBeenCalled()
    })

    it('invokes error callback when server denied connection for missing token', async () => {
      setConnectionMessage(() => ({ error: 'Missing token', code: 401 }))
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
        new Error('Failed to establish connection: Missing token')
      )
      expect(handleNewToken).toHaveBeenCalledWith(null)
      expect(handleNewToken).toHaveBeenCalledTimes(1)
    })

    it('invokes error callback after some time on unresponsive server', async () => {
      setConnectionMessage(() => sleep(8000))
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
        new Error('Failed to establish connection: timeout')
      )
      expect(handleNewToken).not.toHaveBeenCalled()
    }, 3000)

    it('closes and invokes callback on connection lost', async () => {
      await initConnection(
        serverUrl,
        token,
        handleLostConnection,
        handleNewToken
      )
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

    it('can receive fresh token', async () => {
      const newToken = faker.datatype.uuid()
      let ws
      server.on('connection', client => {
        ws = client
      })
      await initConnection(
        serverUrl,
        token,
        handleLostConnection,
        handleNewToken
      )
      expect(handleNewToken).toHaveBeenNthCalledWith(1, token)

      ws.send(JSON.stringify({ token: newToken }))
      await sleep()
      expect(errorSpy).not.toHaveBeenCalled()
      expect(handleLostConnection).not.toHaveBeenCalled()
      expect(handleNewToken).toHaveBeenNthCalledWith(2, newToken)
      expect(handleNewToken).toHaveBeenCalledTimes(2)
    })
  })

  describe('invoke()', () => {
    it('throws an error when invoking function without connection', async () => {
      await expect(invoke('media.test')).rejects.toThrow(
        'unestablished connection, call initConnection() first'
      )
      expect(errorSpy).not.toHaveBeenCalled()
    })
  })

  describe('send()', () => {
    it('throws error when sending data without a connection', async () => {
      expect(() => send('test')).toThrowError(
        new Error(`unestablished connection, call initConnection() first`)
      )
    })

    it('can skip throwing error when sending data without a connection', async () => {
      expect(() => send('test', false)).not.toThrow()
    })
  })

  describe('fromServerEvent()', () => {
    it('can receive server events', async () => {
      const delay = 10
      const args = { foo: faker.random.word() }
      const event1 = faker.random.word()
      const event2 = faker.random.word()
      let ws
      server.on('connection', client => {
        ws = client
      })
      await initConnection(
        serverUrl,
        token,
        handleLostConnection,
        handleNewToken
      )

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

    it('warns unsupported message from server', async () => {
      const delay = 10
      const event = faker.random.word()
      const data = 'does not parse as JSON'

      let ws
      server.on('connection', client => {
        ws = client
      })
      await initConnection(
        serverUrl,
        token,
        handleLostConnection,
        handleNewToken
      )

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

    describe('enhanceUrl()', () => {
      it('adds root url and token', () => {
        expect(enhanceUrl('/media/1')).toBe(
          `${serverUrl.replace('ws', 'http')}/media/1?token=${token}`
        )
      })

      it('handles existing search params', () => {
        expect(enhanceUrl('/media?path=test')).toBe(
          `${serverUrl.replace('ws', 'http')}/media?path=test&token=${token}`
        )
      })
    })

    describe('invoke()', () => {
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

    describe('sendLogs()', () => {
      it('enhance url and sends data', async () => {
        fetch.mockResolvedValueOnce({ ok: true })
        const logs = [{ level: 'error', args: ['coucou'] }]
        expect(await sendLogs(logs)).toBeUndefined()
        expect(fetch).toHaveBeenCalledWith(
          `${serverUrl.replace('ws', 'http')}/logs?token=${token}`,
          {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ logs })
          }
        )
        expect(fetch).toHaveBeenCalledTimes(1)
      })

      it('throws on non-200 response', async () => {
        const error = 'Invalid logs'
        fetch.mockResolvedValueOnce({
          ok: false,
          text: async () => error,
          status: 400
        })
        await expect(
          sendLogs([{ level: 'error', args: ['coucou'] }])
        ).rejects.toThrow(`Failed to send logs: ${error} (400)`)
        expect(fetch).toHaveBeenCalledTimes(1)
      })

      it('proxies http errors', async () => {
        const error = new Error('Connection failed')
        fetch.mockRejectedValueOnce(error)
        await expect(
          sendLogs([{ level: 'error', args: ['coucou'] }])
        ).rejects.toThrow(error)
        expect(fetch).toHaveBeenCalledTimes(1)
      })
    })
  })
})
