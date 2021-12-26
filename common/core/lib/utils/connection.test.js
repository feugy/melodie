'use strict'

const { join, resolve } = require('path')
const { tmpdir } = require('os')
const faker = require('faker')
const { ensureDir, ensureFile } = require('fs-extra')
const got = require('got').extend({
  timeout: 100,
  retry: 0,
  followRedirect: false
})
const WebSocket = require('ws')
const { initConnection, broadcast, messageBus } = require('./connection')
const { getLogger } = require('./logger')
const { sleep, makeFolder } = require('../tests')

function connectWSClient(address, totp, token) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams()
    if (totp) {
      params.set('totp', totp)
    }
    if (token) {
      params.set('token', token)
    }
    let ws = new WebSocket(
      `${address.replace('http', 'ws')}/ws?${params.toString()}`
    )
    ws.once('message', data => resolve({ ws, initMessage: JSON.parse(data) }))
    ws.once('error', reject)
    ws.once('open', () => ws.off('error', reject))
  })
}

function waitWSClosure(ws) {
  return new Promise((resolve, reject) => {
    ws.once('error', reject)
    ws.once('close', () => {
      ws.off('error', reject)
      resolve()
    })
  })
}

function call(ws, data) {
  ws.send(JSON.stringify(data))
}

function listen(ws) {
  return new Promise((resolve, reject) => {
    ws.once('error', reject)
    ws.once('message', data => {
      ws.off('error', reject)
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

describe('connection utilities', () => {
  let errorSpy
  let warnSpy
  let close
  let address
  let folder
  let tracks
  let totp
  const totpSecret = faker.random.word()
  const publicFolder = join(tmpdir(), faker.random.word())

  const services = {
    settings: { get: jest.fn() },
    media: {
      triggerArtistsEnrichment: jest.fn(),
      getAlbumMedia: jest.fn(),
      getArtistMedia: jest.fn(),
      getTrackMedia: jest.fn(),
      getTrackData: jest.fn(),
      isMediaAllowed: jest.fn()
    }
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
    errorSpy = jest
      .spyOn(getLogger('connection'), 'error')
      .mockImplementation(() => {})
    warnSpy = jest
      .spyOn(getLogger('connection'), 'warn')
      .mockImplementation(() => {})
    services.settings.get.mockResolvedValue({
      folders: [folder],
      isBroadcasting: false,
      totpSecret
    })
  })

  afterEach(() => (close ? close() : null))

  it('starts a WebSocket server, connects with valid OTP and can stop', async () => {
    ;({ close, address, totp } = await initConnection(services, publicFolder))
    expect(close).toBeInstanceOf(Function)
    expect(address).toInclude('127.0.0.1')

    const { ws, initMessage } = await connectWSClient(address, totp.generate())

    await expect(got(`${address}/index.html`)).rejects.toThrow(/Not Found/)
    await expect(
      got.get(`${address}${tracks[0].path.replace(/\\/g, '/')}`)
    ).rejects.toThrow(/Not Found/)
    expect(initMessage).toEqual(
      expect.objectContaining({
        settings: {
          folders: [folder],
          isBroadcasting: false,
          totpSecret
        },
        token: expect.any(String)
      })
    )

    const promise = waitWSClosure(ws)
    close()
    await promise
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('can reconnect with JWT', async () => {
    ;({ close, address, totp } = await initConnection(services, publicFolder))
    expect(close).toBeInstanceOf(Function)
    expect(address).toInclude('127.0.0.1')

    let {
      ws,
      initMessage: { token }
    } = await connectWSClient(address, totp.generate())
    ws.terminate()

    ws = (await connectWSClient(address, null, token)).ws
    ws.terminate()

    // both
    ws = (await connectWSClient(address, 'invalid', token)).ws
    ws.terminate()

    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('can not connect with missing OTP', async () => {
    ;({ close, address } = await initConnection(services, publicFolder))
    expect(close).toBeInstanceOf(Function)
    expect(address).toInclude('127.0.0.1')

    await expect(connectWSClient(address)).rejects.toThrow(
      'Unexpected server response: 401'
    )
    await expect(got(`${address}/index.html`)).rejects.toThrow(/Not Found/)

    close()
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('can not connect with invalid OTP', async () => {
    ;({ close, address } = await initConnection(services, publicFolder))
    expect(close).toBeInstanceOf(Function)
    expect(address).toInclude('127.0.0.1')

    await expect(connectWSClient(address, '000000')).rejects.toThrow(
      'Unexpected server response: 403'
    )
    await expect(got(`${address}/index.html`)).rejects.toThrow(/Not Found/)

    close()
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('uses explicit port over settings', async () => {
    const broadcastPort = faker.datatype.number({ min: 2000, max: 4000 })
    const port = faker.datatype.number({ min: 5000, max: 8000 })
    services.settings.get.mockResolvedValueOnce({
      folders: [folder],
      isBroadcasting: false,
      broadcastPort
    })
    ;({ close, address } = await initConnection(services, publicFolder))
    expect(close).toBeInstanceOf(Function)
    expect(address).toInclude(broadcastPort)
    await close()
    ;({ close, address } = await initConnection(services, publicFolder, port))
    expect(close).toBeInstanceOf(Function)
    expect(address).toInclude(port)

    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('can start and stop broadcasting', async () => {
    const port = faker.datatype.number({ min: 9000, max: 10000 })

    ;({ close, address } = await initConnection(services, publicFolder, port))
    expect(close).toBeInstanceOf(Function)
    expect(address).toInclude('127.0.0.1')
    expect(address).toInclude(`:${port}`)
    await expect(got(`${address}/index.html`)).rejects.toThrow(/Not Found/)

    broadcast('settings-saved', {
      folders: [folder],
      isBroadcasting: true
    })
    await sleep(250)
    expect(await got(`${address}/index.html`)).toBeDefined()

    broadcast('settings-saved', {
      folders: [folder],
      isBroadcasting: false
    })
    await sleep(250)
    await expect(got(`${address}/index.html`)).rejects.toThrow(/Not Found/)
  })

  it('can serve static files when broadcasting', async () => {
    services.settings.get.mockResolvedValueOnce({
      folders: [folder],
      isBroadcasting: true
    })
    ;({ close, address } = await initConnection(services, publicFolder))
    expect(address).toInclude('0.0.0.0')
    const response = await got.get(`${address}/index.html`)
    expect(response).toBeDefined()
    expect(response.headers).toEqual(
      expect.objectContaining({
        'access-control-allow-origin': '*'
      })
    )
    await expect(got(`${address}/unknown.js`)).rejects.toThrow(/Not Found/)
  })

  it('throws when initializing connection twice', async () => {
    close = (await initConnection(services, publicFolder)).close
    expect(initConnection(services, publicFolder)).rejects.toThrow(
      `connection already started, stop it first`
    )
  })

  it('can invoke a service function', async () => {
    ;({ close, address, totp } = await initConnection(services, publicFolder))
    const result = { foo: faker.lorem.words() }
    services.media.triggerArtistsEnrichment.mockResolvedValueOnce(result)
    const {
      ws,
      initMessage: { token }
    } = await connectWSClient(address, totp.generate())
    const invoked = 'media.triggerArtistsEnrichment'
    const args = faker.random.arrayElements()
    const id = faker.datatype.uuid()

    expect(await callAndListen(ws, { token, invoked, args, id })).toEqual({
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
    ;({ close, address, totp } = await initConnection(services, publicFolder))
    const {
      ws,
      initMessage: { token }
    } = await connectWSClient(address, totp.generate())
    const name = 'whatever'
    const fn = 'triggerArtistsEnrichment'
    const invoked = `${name}.${fn}`
    const args = faker.random.arrayElements()
    const id = faker.datatype.uuid()

    expect(await callAndListen(ws, { token, invoked, args, id })).toEqual({
      id,
      error: `core doesn't support ${name}.${fn}()`
    })
    expect(errorSpy).toHaveBeenCalledWith(
      { data: { token, invoked, args, id }, err: expect.any(Error) },
      `core doesn't support ${name}.${fn}()`
    )
  })

  it('returns error on unknown function', async () => {
    ;({ close, address, totp } = await initConnection(services, publicFolder))
    const {
      ws,
      initMessage: { token }
    } = await connectWSClient(address, totp.generate())
    const name = 'media'
    const fn = 'whatever'
    const invoked = `${name}.${fn}`
    const args = faker.random.arrayElements()
    const id = faker.datatype.uuid()

    expect(await callAndListen(ws, { token, invoked, args, id })).toEqual({
      id,
      error: `core doesn't support ${name}.${fn}()`
    })
    expect(errorSpy).toHaveBeenCalledWith(
      { data: { token, invoked, args, id }, err: expect.any(Error) },
      `core doesn't support ${name}.${fn}()`
    )
  })

  it('returns error from invoked function', async () => {
    ;({ close, address, totp } = await initConnection(services, publicFolder))
    const err = new Error('boom!')
    services.media.triggerArtistsEnrichment.mockRejectedValueOnce(err)
    const {
      ws,
      initMessage: { token }
    } = await connectWSClient(address, totp.generate())
    const invoked = `media.triggerArtistsEnrichment`
    const args = faker.random.arrayElements()
    const id = faker.datatype.uuid()

    expect(await callAndListen(ws, { token, invoked, args, id })).toEqual({
      id,
      error: err.message
    })
    expect(errorSpy).toHaveBeenCalledWith(
      { data: { token, invoked, args, id }, err },
      err.message
    )
  })

  it('logs warning on unsupported message', async () => {
    ;({ close, address, totp } = await initConnection(services, publicFolder))
    const { ws } = await connectWSClient(address, totp.generate())

    const data = { foo: faker.random.word() }
    call(ws, data)
    await sleep(10)

    expect(errorSpy).toHaveBeenCalledWith(
      { data, reason: expect.any(String) },
      `unsupported message received`
    )
  })

  it('logs warning on unparseable message', async () => {
    ;({ close, address, totp } = await initConnection(services, publicFolder))
    const { ws } = await connectWSClient(address, totp.generate())

    const rawData = 'does not parse to JSON'
    ws.send(rawData)
    await sleep(10)

    expect(errorSpy).toHaveBeenCalledWith(
      { rawData: Buffer.from(rawData) },
      `can not process message: Unexpected token d in JSON at position 0`
    )
  })

  it('broadcast external and internal messages', async () => {
    const event = faker.random.word()
    ;({ close, address, totp } = await initConnection(services, publicFolder))
    const listener = jest.fn()
    const { ws: ws1 } = await connectWSClient(address, totp.generate())
    const { ws: ws2 } = await connectWSClient(address, totp.generate())
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

  describe('given a running server', () => {
    beforeEach(async () => {
      ;({ close, address, totp } = await initConnection(services, publicFolder))
    })

    const mp3 = resolve(__dirname, '..', '..', '..', 'fixtures', 'file.mp3')
    const cover = resolve(__dirname, '..', '..', '..', 'fixtures', 'cover.jpg')
    const avatar = resolve(
      __dirname,
      '..',
      '..',
      '..',
      'fixtures',
      'avatar.jpg'
    )

    describe.each([
      ['given no token', ''],
      ['given invalid token', '?token=123456']
    ])('%s', (title, token) => {
      it('denies access to album cover', async () => {
        const id = faker.datatype.number({ min: 1000 })
        const count = faker.datatype.number({ min: 1, max: 10 })
        await expect(
          got.get(`${address}/albums/${id}/media/${count}${token}`)
        ).rejects.toThrow(/Unauthorized/)
        expect(services.media.getAlbumMedia).not.toHaveBeenCalled()
      })

      it('denies access to track data', async () => {
        const id = faker.datatype.number({ min: 1000 })
        await expect(
          got.get(`${address}/tracks/${id}/data${token}`)
        ).rejects.toThrow(/Unauthorized/)
        expect(services.media.getTrackData).not.toHaveBeenCalled()
      })

      it('denies access to track cover', async () => {
        const id = faker.datatype.number({ min: 1000 })
        const count = faker.datatype.number({ min: 1, max: 10 })
        await expect(
          got.get(`${address}/tracks/${id}/media/${count}${token}`)
        ).rejects.toThrow(/Unauthorized/)
        expect(services.media.getTrackMedia).not.toHaveBeenCalled()
      })

      it('denies access to artist artworks', async () => {
        const id = faker.datatype.number({ min: 1000 })
        const count = faker.datatype.number({ min: 1, max: 10 })
        await expect(
          got.get(`${address}/artists/${id}/media/${count}${token}`)
        ).rejects.toThrow(/Unauthorized/)
        expect(services.media.getArtistMedia).not.toHaveBeenCalled()
      })

      it('denies access to possible local medias', async () => {
        services.media.getTrackMedia.mockResolvedValueOnce(cover)
        await expect(
          got.get(`${address}/media${token}`, {
            searchParams: { path: cover }
          })
        ).rejects.toThrow(/Unauthorized/)
        expect(services.media.isMediaAllowed).not.toHaveBeenCalled()
      })
    })

    describe('given a connected client', () => {
      let ws
      let token

      beforeEach(async () => {
        const result = await connectWSClient(address, totp.generate())
        ws = result.ws
        token = result.initMessage.token
      })

      afterEach(async () => ws.close())
      describe.each([
        [
          'given no token',
          undefined,
          `Validation errors:
data must have required property 'error'
data must have required property 'warn'
data must have required property 'token'
data must match exactly one schema in oneOf`
        ],
        ['given invalid token', '123456', 'The token is malformed.']
      ])('%s', (title, token, error) => {
        it('logs UI errors', async () => {
          const data = { error: 'for testing!', lineno: 10, colno: 153 }
          call(ws, data)
          await sleep(10)
          expect(errorSpy).toHaveBeenCalledWith(
            data,
            `UI error: "${data.error}"`
          )
          expect(warnSpy).not.toHaveBeenCalled()
        })

        it('logs UI warnings', async () => {
          const data = { warn: 'for testing!', lineno: 10, colno: 153 }
          call(ws, data)
          await sleep(10)
          expect(warnSpy).toHaveBeenCalledWith(
            data,
            `UI warning: "${data.warn}"`
          )
          expect(errorSpy).not.toHaveBeenCalled()
        })

        it('can not invoke a service function', async () => {
          expect(
            await callAndListen(ws, {
              token,
              invoked: 'media.triggerArtistsEnrichment',
              args: faker.random.arrayElements(),
              id: faker.datatype.uuid()
            })
          ).toEqual({ error })
          expect(services.media.triggerArtistsEnrichment).not.toHaveBeenCalled()
          expect(errorSpy).toHaveBeenCalled()
        })

        it('can not invoke a service function', async () => {
          expect(
            await callAndListen(ws, {
              token,
              invoked: 'media.triggerArtistsEnrichment',
              args: faker.random.arrayElements(),
              id: faker.datatype.uuid()
            })
          ).toEqual({ error })
          expect(services.media.triggerArtistsEnrichment).not.toHaveBeenCalled()
          expect(errorSpy).toHaveBeenCalled()
        })
      })

      it('serves album covers', async () => {
        const id = faker.datatype.number({ min: 1000 })
        const count = faker.datatype.number({ min: 1, max: 10 })
        services.media.getAlbumMedia.mockResolvedValueOnce(cover)
        const response = await got.get(
          `${address}/albums/${id}/media/${count}?token=${token}`
        )
        expect(response.statusCode).toEqual(200)
        expect(response.headers).toEqual(
          expect.objectContaining({
            etag: expect.any(String),
            'content-type': 'image/jpeg',
            'content-length': '172447'
          })
        )
        expect(services.media.getAlbumMedia).toHaveBeenCalledWith(
          `${id}`,
          count
        )
        expect(services.media.getAlbumMedia).toHaveBeenCalledTimes(1)
      })

      it('returns 404 for unknown album cover', async () => {
        const id = faker.datatype.number({ min: 1000 })
        const count = faker.datatype.number({ min: 1, max: 10 })
        services.media.getAlbumMedia.mockResolvedValueOnce(null)
        await expect(
          got.get(`${address}/albums/${id}/media/${count}?token=${token}`)
        ).rejects.toThrow(/Not Found/)
        expect(services.media.getAlbumMedia).toHaveBeenCalledWith(
          `${id}`,
          count
        )
        expect(services.media.getAlbumMedia).toHaveBeenCalledTimes(1)
      })

      it('serves track data', async () => {
        const id = faker.datatype.number({ min: 1000 })
        services.media.getTrackData.mockResolvedValueOnce(mp3)
        const response = await got.get(
          `${address}/tracks/${id}/data?token=${token}`
        )
        expect(response.statusCode).toEqual(200)
        expect(response.headers).toEqual(
          expect.objectContaining({
            etag: expect.any(String),
            'content-type': 'audio/mpeg',
            'content-length': '169984'
          })
        )
        expect(services.media.getTrackData).toHaveBeenCalledWith(
          `${id}`,
          undefined
        )
        expect(services.media.getTrackData).toHaveBeenCalledTimes(1)
      })

      it('returns 404 for unknown track data', async () => {
        const id = faker.datatype.number({ min: 1000 })
        services.media.getTrackData.mockResolvedValueOnce(null)
        await expect(
          got.get(`${address}/tracks/${id}/data?token=${token}`)
        ).rejects.toThrow(/Not Found/)
        expect(services.media.getTrackData).toHaveBeenCalledWith(
          `${id}`,
          undefined
        )
        expect(services.media.getTrackData).toHaveBeenCalledTimes(1)
      })

      it('serves track covers', async () => {
        const id = faker.datatype.number({ min: 1000 })
        const count = faker.datatype.number({ min: 1, max: 10 })
        services.media.getTrackMedia.mockResolvedValueOnce(cover)
        const response = await got.get(
          `${address}/tracks/${id}/media/${count}?token=${token}`
        )
        expect(response.statusCode).toEqual(200)
        expect(response.headers).toEqual(
          expect.objectContaining({
            etag: expect.any(String),
            'content-type': 'image/jpeg',
            'content-length': '172447'
          })
        )
        expect(services.media.getTrackMedia).toHaveBeenCalledWith(
          `${id}`,
          count
        )
        expect(services.media.getTrackMedia).toHaveBeenCalledTimes(1)
      })

      it('returns 404 for unknown track cover', async () => {
        const id = faker.datatype.number({ min: 1000 })
        const count = faker.datatype.number({ min: 1, max: 10 })
        services.media.getTrackMedia.mockResolvedValueOnce(null)
        await expect(
          got.get(`${address}/tracks/${id}/media/${count}?token=${token}`)
        ).rejects.toThrow(/Not Found/)
        expect(services.media.getTrackMedia).toHaveBeenCalledWith(
          `${id}`,
          count
        )
        expect(services.media.getTrackMedia).toHaveBeenCalledTimes(1)
      })

      it('serves artist artworks', async () => {
        const id = faker.datatype.number({ min: 1000 })
        const count = faker.datatype.number({ min: 1, max: 10 })
        services.media.getArtistMedia.mockResolvedValueOnce(avatar)
        const response = await got.get(
          `${address}/artists/${id}/media/${count}?token=${token}`
        )
        expect(response.statusCode).toEqual(200)
        expect(response.headers).toEqual(
          expect.objectContaining({
            etag: expect.any(String),
            'content-type': 'image/jpeg',
            'content-length': '19790'
          })
        )
        expect(services.media.getArtistMedia).toHaveBeenCalledWith(
          `${id}`,
          count
        )
        expect(services.media.getArtistMedia).toHaveBeenCalledTimes(1)
      })

      it('returns 404 for unknown artist artwork', async () => {
        const id = faker.datatype.number({ min: 1000 })
        const count = faker.datatype.number({ min: 1, max: 10 })
        services.media.getArtistMedia.mockResolvedValueOnce(null)
        await expect(
          got.get(`${address}/artists/${id}/media/${count}?token=${token}`)
        ).rejects.toThrow(/Not Found/)
        expect(services.media.getArtistMedia).toHaveBeenCalledWith(
          `${id}`,
          count
        )
        expect(services.media.getArtistMedia).toHaveBeenCalledTimes(1)
      })

      it('serves possible media', async () => {
        services.media.isMediaAllowed.mockResolvedValueOnce(true)
        const response = await got.get(`${address}/media`, {
          searchParams: { token, path: avatar }
        })
        expect(response.statusCode).toEqual(200)
        expect(response.headers).toEqual(
          expect.objectContaining({
            etag: expect.any(String),
            'content-type': 'image/jpeg',
            'content-length': '19790'
          })
        )
      })

      it('returns 404 for unknown media', async () => {
        services.media.isMediaAllowed.mockResolvedValueOnce(true)
        await expect(
          got.get(`${address}/media`, {
            searchParams: { token, path: avatar.replace('.jpg', '.png') }
          })
        ).rejects.toThrow(/Not Found/)
      })

      it('returns 404 for unsupported media', async () => {
        services.media.isMediaAllowed.mockResolvedValueOnce(false)
        await expect(
          got.get(`${address}/media`, {
            searchParams: { token, path: mp3 }
          })
        ).rejects.toThrow(/Forbidden/)
      })
    })

    describe('given mocked time', () => {
      let ws

      beforeEach(jest.useFakeTimers)

      afterEach(() => {
        ws?.close()
        jest.useRealTimers()
      })

      it('regularly sends new token', async () => {
        const now = Date.now()
        ;({ ws } = await connectWSClient(address, totp.generate()))
        let promise = listen(ws)

        jest.setSystemTime(now + 30 * 60 * 1000)
        jest.runOnlyPendingTimers()

        const message1 = await promise
        expect(message1).toEqual({
          token: expect.any(String)
        })

        promise = listen(ws)

        jest.setSystemTime(now + 30 * 60 * 1000)
        jest.runOnlyPendingTimers()

        const message2 = await promise

        expect(message2).toEqual({
          token: expect.any(String)
        })
      })
    })
  })
})
