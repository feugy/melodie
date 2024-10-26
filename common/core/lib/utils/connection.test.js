import { faker } from '@faker-js/faker'
import { ensureDir, ensureFile } from 'fs-extra'
import Got from 'got'
import { tmpdir } from 'os'
import { join, resolve } from 'path'
import { CookieJar } from 'tough-cookie'
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'
import WebSocket from 'ws'

import { makeFolder, sleep } from '../tests'
import { broadcast, initConnection, messageBus } from './connection'
import { getLogger } from './logger'

const cookieJar = new CookieJar()
const got = Got.extend({
  timeout: { lookup: 100 },
  retry: { limit: 0 },
  followRedirect: false,
  cookieJar
})

function connectWSClient(address, token) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams()
    if (token) {
      params.set('token', token)
    }
    let ws = new WebSocket(
      `${address.replace('http', 'ws')}/ws?${params.toString()}`
    )
    ws.once('message', data =>
      resolve({ ws, initMessage: JSON.parse(data.toString()) })
    )
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
  let uiErrorSpy
  let uiWarnSpy
  let close
  let address
  let folder
  let tracks
  let totp
  const externalIp = '79.191.130.17'
  const totpSecret = faker.string.alpha()
  const publicFolder = join(tmpdir(), faker.string.alpha())
  const trackId = faker.string.uuid()

  const services = {
    settings: { get: vi.fn() },
    media: {
      triggerArtistsEnrichment: vi.fn(),
      getAlbumMedia: vi.fn(),
      getArtistMedia: vi.fn(),
      getTrackMedia: vi.fn(),
      getTrackData: vi.fn(),
      isMediaAllowed: vi.fn()
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
    vi.resetAllMocks()
    errorSpy = vi
      .spyOn(getLogger('connection'), 'error')
      .mockImplementation(() => {})
    uiErrorSpy = vi.spyOn(getLogger('ui'), 'error').mockImplementation(() => {})
    uiWarnSpy = vi.spyOn(getLogger('ui'), 'warn').mockImplementation(() => {})
    services.settings.get.mockResolvedValue({
      folders: [folder],
      isBroadcasting: false,
      totpSecret
    })
    services.media.getTrackData.mockResolvedValueOnce(tracks[0].path)
    cookieJar.removeAllCookiesSync()
  })

  afterEach(() => (close ? close() : null))

  it('starts a WebSocket server, connects localy with no token and can stop', async () => {
    ;({ close, address } = await initConnection(services, publicFolder))
    expect(close).toBeInstanceOf(Function)
    expect(address).toEqual(expect.stringContaining('127.0.0.1'))

    const { ws, initMessage } = await connectWSClient(address)

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

  it('can not generate a token with a missing OTP', async () => {
    ;({ close, address } = await initConnection(services, publicFolder, 0))

    await expect(got.post(`${address}/token`)).rejects.toThrow(
      'Response code 401 (Unauthorized)'
    )
    close()
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('can not generate a token with an invalid OTP', async () => {
    ;({ close, address } = await initConnection(
      services,
      publicFolder,
      0,
      externalIp
    ))

    await expect(
      got.post(`${address}/token`, {
        body: '000000',
        headers: {
          'content-type': 'text/plain',
          'x-forwarded-for': '192.168.0.1'
        }
      })
    ).rejects.toThrow('Response code 401 (Unauthorized)')
    close()
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('can generate a token from valid OTP', async () => {
    ;({ close, address, totp } = await initConnection(
      services,
      publicFolder,
      0,
      externalIp
    ))

    const token = await got
      .post(`${address}/token`, {
        body: totp.generate(),
        headers: { 'content-type': 'text/plain' }
      })
      .text()
    expect(token).toBeDefined()
    await cookieJar.setCookie(`token=${token}`, address)
    expect(await got(`${address}/tracks/${trackId}/data`)).toBeDefined()

    close()
    expect(errorSpy).not.toHaveBeenCalled()
    expect(services.media.getTrackData).toHaveBeenCalledWith(trackId, undefined)
    expect(services.media.getTrackData).toHaveBeenCalledOnce()
  })

  it('uses explicit port over settings', async () => {
    const broadcastPort = faker.number.int({ min: 2000, max: 4000 })
    const port = faker.number.int({ min: 5000, max: 8000 })
    services.settings.get.mockResolvedValueOnce({
      folders: [folder],
      isBroadcasting: false,
      broadcastPort
    })
    ;({ close, address } = await initConnection(services, publicFolder))
    expect(close).toBeInstanceOf(Function)
    expect(address).toEqual(expect.stringContaining(broadcastPort.toString()))
    await close()
    ;({ close, address } = await initConnection(services, publicFolder, port))
    expect(close).toBeInstanceOf(Function)
    expect(address).toEqual(expect.stringContaining(port.toString()))

    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('can start and stop broadcasting', async () => {
    const port = faker.number.int({ min: 9000, max: 10000 })

    ;({ close, address } = await initConnection(services, publicFolder, port))
    expect(close).toBeInstanceOf(Function)
    expect(address).toEqual(expect.stringContaining('127.0.0.1'))
    expect(address).toEqual(expect.stringContaining(`:${port}`))
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
    expect(address).toEqual(expect.stringContaining('0.0.0.0'))
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
    await expect(initConnection(services, publicFolder)).rejects.toThrow(
      `connection already started, stop it first`
    )
  })

  it('can invoke a service function', async () => {
    ;({ close, address } = await initConnection(services, publicFolder))
    const result = { foo: faker.lorem.words() }
    services.media.triggerArtistsEnrichment.mockResolvedValueOnce(result)
    const {
      ws,
      initMessage: { token }
    } = await connectWSClient(address)
    const invoked = 'media.triggerArtistsEnrichment'
    const args = faker.helpers.arrayElements(['cat', 'dog', 'cow'])
    const id = faker.string.uuid()

    expect(await callAndListen(ws, { token, invoked, args, id })).toEqual({
      id,
      result
    })
    expect(services.media.triggerArtistsEnrichment).toHaveBeenCalledWith(
      ...args
    )
    expect(services.media.triggerArtistsEnrichment).toHaveBeenCalledOnce()
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('returns error on unknown module', async () => {
    ;({ close, address } = await initConnection(services, publicFolder))
    const {
      ws,
      initMessage: { token }
    } = await connectWSClient(address)
    const name = 'whatever'
    const fn = 'triggerArtistsEnrichment'
    const invoked = `${name}.${fn}`
    const args = faker.helpers.arrayElements(['cat', 'dog', 'cow'])
    const id = faker.string.uuid()

    expect(await callAndListen(ws, { token, invoked, args, id })).toEqual({
      id,
      error: `core doesn't support ${name}.${fn}()`
    })
    expect(errorSpy).toHaveBeenCalledWith(
      {
        data: { token, invoked, args, id },
        err: expect.any(Error),
        id: 'req-1'
      },
      `core doesn't support ${name}.${fn}()`
    )
  })

  it('returns error on unknown function', async () => {
    ;({ close, address } = await initConnection(services, publicFolder))
    const {
      ws,
      initMessage: { token }
    } = await connectWSClient(address)
    const name = 'media'
    const fn = 'whatever'
    const invoked = `${name}.${fn}`
    const args = faker.helpers.arrayElements(['cat', 'dog', 'cow'])
    const id = faker.string.uuid()

    expect(await callAndListen(ws, { token, invoked, args, id })).toEqual({
      id,
      error: `core doesn't support ${name}.${fn}()`
    })
    expect(errorSpy).toHaveBeenCalledWith(
      {
        data: { token, invoked, args, id },
        err: expect.any(Error),
        id: 'req-1'
      },
      `core doesn't support ${name}.${fn}()`
    )
  })

  it('returns error from invoked function', async () => {
    ;({ close, address } = await initConnection(services, publicFolder))
    const err = new Error('boom!')
    services.media.triggerArtistsEnrichment.mockRejectedValueOnce(err)
    const {
      ws,
      initMessage: { token }
    } = await connectWSClient(address)
    const invoked = `media.triggerArtistsEnrichment`
    const args = faker.helpers.arrayElements(['cat', 'dog', 'cow'])
    const id = faker.string.uuid()

    expect(await callAndListen(ws, { token, invoked, args, id })).toEqual({
      id,
      error: err.message
    })
    expect(errorSpy).toHaveBeenCalledWith(
      { data: { token, invoked, args, id }, err, id: 'req-1' },
      err.message
    )
  })

  it('logs warning on unsupported message', async () => {
    ;({ close, address } = await initConnection(services, publicFolder))
    const { ws } = await connectWSClient(address)

    const data = { foo: faker.string.alpha() }
    call(ws, data)
    await sleep(10)

    expect(errorSpy).toHaveBeenCalledWith(
      { data, reason: expect.any(String) },
      `unsupported message received`
    )
  })

  it('logs warning on unparseable message', async () => {
    ;({ close, address } = await initConnection(services, publicFolder))
    const { ws } = await connectWSClient(address)

    const rawData = 'does not parse to JSON'
    ws.send(rawData)
    await sleep(10)

    expect(errorSpy).toHaveBeenCalledWith(
      { rawData: Buffer.from(rawData), id: 'req-1' },
      `can not process message: Unexpected token 'd', "does not p"... is not valid JSON`
    )
  })

  it('broadcast external and internal messages', async () => {
    const event = faker.string.alpha()
    ;({ close, address } = await initConnection(services, publicFolder))
    const listener = vi.fn()
    const { ws: ws1 } = await connectWSClient(address)
    const { ws: ws2 } = await connectWSClient(address)
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
    expect(listener).toHaveBeenCalledOnce()

    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('throws error when broadcasting without connection', async () => {
    expect(() => broadcast(faker.string.alpha(), {})).toThrow(
      `unstarted connection, call subscribeRemote() first`
    )
    expect(errorSpy).not.toHaveBeenCalled()
  })

  describe('given a running server', () => {
    beforeEach(async () => {
      ;({ close, address, totp } = await initConnection(
        services,
        publicFolder,
        0,
        externalIp
      ))
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
      { title: 'given no token', token: '', error: 'Missing token' },
      {
        title: 'given invalid token',
        token: '123456',
        error: 'The token is malformed.'
      }
    ])('$title', ({ token, error }) => {
      it('denies Web Socket connection', async () => {
        await expect(connectWSClient(address, token)).resolves.toMatchObject({
          initMessage: { error }
        })
        expect(services.media.getAlbumMedia).not.toHaveBeenCalled()
      })
    })

    describe.each([
      { title: 'given no token', token: '' },
      { title: 'given invalid token', token: '?token=123456' }
    ])('$title', ({ token }) => {
      it('denies access to album cover', async () => {
        const id = faker.number.int({ min: 1000 })
        const count = faker.number.int({ min: 1, max: 10 })
        await expect(
          got.get(`${address}/albums/${id}/media/${count}${token}`)
        ).rejects.toThrow(/Forbidden/)
        expect(services.media.getAlbumMedia).not.toHaveBeenCalled()
      })

      it('denies access to track data', async () => {
        const id = faker.number.int({ min: 1000 })
        await expect(
          got.get(`${address}/tracks/${id}/data${token}`)
        ).rejects.toThrow(/Forbidden/)
        expect(services.media.getTrackData).not.toHaveBeenCalled()
      })

      it('denies access to track cover', async () => {
        const id = faker.number.int({ min: 1000 })
        const count = faker.number.int({ min: 1, max: 10 })
        await expect(
          got.get(`${address}/tracks/${id}/media/${count}${token}`)
        ).rejects.toThrow(/Forbidden/)
        expect(services.media.getTrackMedia).not.toHaveBeenCalled()
      })

      it('denies access to artist artworks', async () => {
        const id = faker.number.int({ min: 1000 })
        const count = faker.number.int({ min: 1, max: 10 })
        await expect(
          got.get(`${address}/artists/${id}/media/${count}${token}`)
        ).rejects.toThrow(/Forbidden/)
        expect(services.media.getArtistMedia).not.toHaveBeenCalled()
      })

      it('denies access to possible local medias', async () => {
        services.media.getTrackMedia.mockResolvedValueOnce(cover)
        await expect(
          got.get(`${address}/media${token}`, {
            searchParams: { path: cover }
          })
        ).rejects.toThrow(/Forbidden/)
        expect(services.media.isMediaAllowed).not.toHaveBeenCalled()
      })

      it('denies access to logs', async () => {
        services.media.getTrackMedia.mockResolvedValueOnce(cover)
        await expect(
          got.post(`${address}/logs${token}`, {
            json: { logs: [{ level: 'error', args: ['boom!'] }] }
          })
        ).rejects.toThrow(/Forbidden/)
        expect(uiErrorSpy).not.toHaveBeenCalled()
      })
    })

    describe('given a connected client', () => {
      let ws
      let token

      beforeEach(async () => {
        token = await got
          .post(`${address}/token`, {
            body: totp.generate(),
            headers: { 'content-type': 'text/plain' }
          })
          .text()
        const result = await connectWSClient(address, token)
        ws = result.ws
      })

      afterEach(async () => ws.close())

      describe.each([
        {
          title: 'given no token',
          error: `Validation errors:
data must have required property 'token'`
        },
        {
          title: 'given invalid token',
          token: '123456',
          error: 'The token is malformed.'
        }
      ])('$title', ({ token, error }) => {
        it('can not invoke a service function', async () => {
          expect(
            await callAndListen(ws, {
              token,
              invoked: 'media.triggerArtistsEnrichment',
              args: faker.helpers.arrayElements(['cat', 'dog', 'cow']),
              id: faker.string.uuid()
            })
          ).toEqual({ error })
          expect(services.media.triggerArtistsEnrichment).not.toHaveBeenCalled()
          expect(errorSpy).toHaveBeenCalled()
        })
      })

      it('writes UI logs', async () => {
        const logs = [
          { level: 'error', args: ['for testing!'] },
          { level: 'warn', args: ['Howdy!', 4] }
        ]
        await cookieJar.setCookie(`token=${token}`, address)
        await got.post(`${address}/logs`, { json: { logs } })
        await sleep(10)
        expect(uiErrorSpy).toHaveBeenCalledWith(
          { time: logs[0].time },
          ...logs[0].args
        )
        expect(uiWarnSpy).toHaveBeenCalledWith(
          { time: logs[1].time },
          ...logs[1].args
        )
      })

      it('serves album covers', async () => {
        const id = faker.number.int({ min: 1000 })
        const count = faker.number.int({ min: 1, max: 10 })
        services.media.getAlbumMedia.mockResolvedValueOnce(cover)
        await cookieJar.setCookie(`token=${token}`, address)
        const response = await got.get(`${address}/albums/${id}/media/${count}`)
        expect(response.statusCode).toBe(200)
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
        expect(services.media.getAlbumMedia).toHaveBeenCalledOnce()
      })

      it('returns 404 for unknown album cover', async () => {
        const id = faker.number.int({ min: 1000 })
        const count = faker.number.int({ min: 1, max: 10 })
        services.media.getAlbumMedia.mockResolvedValueOnce(null)
        await cookieJar.setCookie(`token=${token}`, address)
        await expect(
          got.get(`${address}/albums/${id}/media/${count}`)
        ).rejects.toThrow(/Not Found/)
        expect(services.media.getAlbumMedia).toHaveBeenCalledWith(
          `${id}`,
          count
        )
        expect(services.media.getAlbumMedia).toHaveBeenCalledOnce()
      })

      it('serves track data', async () => {
        const id = faker.number.int({ min: 1000 })
        services.media.getTrackData.mockReset().mockResolvedValueOnce(mp3)
        await cookieJar.setCookie(`token=${token}`, address)
        const response = await got.get(`${address}/tracks/${id}/data`)
        expect(response.statusCode).toBe(200)
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
        expect(services.media.getTrackData).toHaveBeenCalledOnce()
      })

      it('returns 404 for unknown track data', async () => {
        const id = faker.number.int({ min: 1000 })
        services.media.getTrackData.mockReset().mockResolvedValueOnce(null)
        await cookieJar.setCookie(`token=${token}`, address)
        await expect(got.get(`${address}/tracks/${id}/data`)).rejects.toThrow(
          /Not Found/
        )
        expect(services.media.getTrackData).toHaveBeenCalledWith(
          `${id}`,
          undefined
        )
        expect(services.media.getTrackData).toHaveBeenCalledOnce()
      })

      it('serves track covers', async () => {
        const id = faker.number.int({ min: 1000 })
        const count = faker.number.int({ min: 1, max: 10 })
        services.media.getTrackMedia.mockResolvedValueOnce(cover)
        await cookieJar.setCookie(`token=${token}`, address)
        const response = await got.get(`${address}/tracks/${id}/media/${count}`)
        expect(response.statusCode).toBe(200)
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
        expect(services.media.getTrackMedia).toHaveBeenCalledOnce()
      })

      it('returns 404 for unknown track cover', async () => {
        const id = faker.number.int({ min: 1000 })
        const count = faker.number.int({ min: 1, max: 10 })
        services.media.getTrackMedia.mockResolvedValueOnce(null)
        await cookieJar.setCookie(`token=${token}`, address)
        await expect(
          got.get(`${address}/tracks/${id}/media/${count}`)
        ).rejects.toThrow(/Not Found/)
        expect(services.media.getTrackMedia).toHaveBeenCalledWith(
          `${id}`,
          count
        )
        expect(services.media.getTrackMedia).toHaveBeenCalledOnce()
      })

      it('serves artist artworks', async () => {
        const id = faker.number.int({ min: 1000 })
        const count = faker.number.int({ min: 1, max: 10 })
        services.media.getArtistMedia.mockResolvedValueOnce(avatar)
        await cookieJar.setCookie(`token=${token}`, address)
        const response = await got.get(
          `${address}/artists/${id}/media/${count}`
        )
        expect(response.statusCode).toBe(200)
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
        expect(services.media.getArtistMedia).toHaveBeenCalledOnce()
      })

      it('returns 404 for unknown artist artwork', async () => {
        const id = faker.number.int({ min: 1000 })
        const count = faker.number.int({ min: 1, max: 10 })
        services.media.getArtistMedia.mockResolvedValueOnce(null)
        await cookieJar.setCookie(`token=${token}`, address)
        await expect(
          got.get(`${address}/artists/${id}/media/${count}`)
        ).rejects.toThrow(/Not Found/)
        expect(services.media.getArtistMedia).toHaveBeenCalledWith(
          `${id}`,
          count
        )
        expect(services.media.getArtistMedia).toHaveBeenCalledOnce()
      })

      it('serves possible media', async () => {
        services.media.isMediaAllowed.mockResolvedValueOnce(true)
        await cookieJar.setCookie(`token=${token}`, address)
        const response = await got.get(`${address}/media`, {
          searchParams: { token, path: avatar }
        })
        expect(response.statusCode).toBe(200)
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
        await cookieJar.setCookie(`token=${token}`, address)
        await expect(
          got.get(`${address}/media`, {
            searchParams: { token, path: avatar.replace('.jpg', '.png') }
          })
        ).rejects.toThrow(/Not Found/)
      })

      it('returns 403 for unsupported media', async () => {
        services.media.isMediaAllowed.mockResolvedValueOnce(false)
        await cookieJar.setCookie(`token=${token}`, address)
        await expect(
          got.get(`${address}/media`, {
            searchParams: { token, path: mp3 }
          })
        ).rejects.toThrow(/Forbidden/)
      })
    })

    describe('given mocked time', () => {
      let ws

      beforeEach(() => vi.useFakeTimers())

      afterEach(() => {
        ws?.close()
        vi.useRealTimers()
      })

      it('regularly sends new token', async () => {
        const now = Date.now()
        const token = await got
          .post(`${address}/token`, {
            body: totp.generate(),
            headers: { 'content-type': 'text/plain' }
          })
          .text()
        ;({ ws } = await connectWSClient(address, token))
        let promise = listen(ws)

        vi.setSystemTime(now + 30 * 60 * 1000)
        vi.runOnlyPendingTimers()

        const message1 = await promise
        expect(message1).toEqual({
          token: expect.any(String)
        })

        promise = listen(ws)

        vi.setSystemTime(now + 30 * 60 * 1000)
        vi.runOnlyPendingTimers()

        const message2 = await promise

        expect(message2).toEqual({
          token: expect.any(String)
        })
      })
    })
  })
})
