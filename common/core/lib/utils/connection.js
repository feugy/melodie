import compressPlugin from '@fastify/compress'
import cookiePlugin from '@fastify/cookie'
import corsPlugin from '@fastify/cors'
import jwtPlugin from '@fastify/jwt'
import staticPlugin from '@fastify/static'
import websocketPlugin from '@fastify/websocket'
import Ajv from 'ajv'
import { randomUUID } from 'crypto'
import { EventEmitter } from 'events'
import fastify from 'fastify'
import S from 'fluent-json-schema'
import * as OTPAuth from 'otpauth'
import { basename, dirname } from 'path'
import WebSocket from 'ws'

import { getLogger } from './logger.js'

const logger = getLogger('connection')
const uiLogger = getLogger('ui')
let server
const ajv = new Ajv({ allErrors: true })
const validate = ajv.compile({
  type: 'object',
  properties: {
    token: { type: 'string' },
    invoked: { type: 'string' },
    id: { type: 'string' },
    args: { type: 'array' },
    additionnalProperties: false
  },
  required: ['token', 'invoked', 'id']
})

const maxAge = 1000 * 60 * 60 * 24 * 2
const JWTAlgorithm = 'HS512'
const JWTExpiryInSeconds = 30 * 60
const keepAliveInSeconds = 3
// make a new secret on every Mélodie restart
const JWTSecret = randomUUID()

/**
 * Message bus to receive events internally.
 */
export const messageBus = new EventEmitter()
messageBus.setMaxListeners(10000)

/**
 * @typedef {object} ConnectionResult
 * @property {string} address - connection listening URL.
 * @property {function} close - function to close the connection.
 * @property {require('otpauth').TOTP} totp - Time based One-Time Password generator utility, used to open WS channel.
 */

/**
 * Exposes services and their functions through a WebSocket connection, and serve static content
 * Connection clients can invoke any service function by:
 * 1. sending a request message with 'invoked' (service and function names), 'args' (array of parameters) and 'id'
 * 2. awaiting on a response message with 'id' (same as in request message) and 'result' (any)
 *
 * Since data goes over the wire, the invoked function args and result must be serializable as strings.
 * Clients can also send their logs: an array of object containing level (string) and args (array of anything).
 *
 * If `settings.isBroadcasting` is true, all files from public folder will be served by an http server,
 * as well as any file present in tracked folders. Addded tracked folders will automatically be served, or removed accordingly.
 * Changing `isBroadcasting` flag is settings will restart the server to stop or start broadcasting.
 *
 * If the listening port isn't explicitly specified, `settings.broadcastPort` will be used, or if not set, the first available
 * port.
 * @async
 * @param {object} services         - services exposed: their properties are expected to be objects, and the nested keys are functions.
 * @param {string} publicFolder     - relative or absolute path to the public folder served.
 * @param {number} [port = 0]       - port this server will listening to (by default uses broadcastPort from settings, or gets the first available port)
 * @param {string} [remoteAddress]  - fixed IP address used for incoming request. Only used for testing.
 * @returns {ConnectionResult} connection created
 * @throws {error} when connection has already been started
 */
export const initConnection = async function (
  services,
  publicFolder,
  port = 0,
  remoteAddress = undefined
) {
  if (server) {
    throw new Error(`connection already started, stop it first`)
  }

  let settings = await services.settings.get()
  messageBus.on('settings-saved', handleSavedSettings)

  const period = 30

  const TOTP = new OTPAuth.TOTP({
    issuer: 'Mélodie',
    algorithm: 'SHA256',
    digits: 6,
    period,
    secret: OTPAuth.Secret.fromUTF8(settings.totpSecret)
  })

  async function startServer() {
    server = fastify({ logger, disableRequestLogging: true })

    if (remoteAddress) {
      // just for testing
      server.addHook('onRequest', async request => {
        request.raw.connection = { ...request.raw.connection, remoteAddress }
      })
    }

    const origin = settings.isBroadcasting ? '*' : 'http://localhost:3000'
    await server.register(corsPlugin, { origin })

    await server.register(jwtPlugin, {
      secret: JWTSecret,
      sign: { algorithm: JWTAlgorithm, expiresIn: `${JWTExpiryInSeconds}s` },
      verify: { algorithms: [JWTAlgorithm] }
    })

    await server.register(websocketPlugin)

    await server.register(compressPlugin)

    await server.register(staticPlugin, {
      root: publicFolder,
      wildcard: false,
      serve: settings.isBroadcasting,
      maxAge: maxAge,
      immutable: true,
      cacheControl: true
    })

    await server.register(cookiePlugin)

    // websocket must always come before other routes
    // https://github.com/fastify/fastify-websocket#using-hooks
    await server.get('/ws', { websocket: true }, handleConnection)

    await server.register(async server => {
      server.addHook('preValidation', async req => {
        if (!isLocalhost(req.ip)) {
          verifyToken(extractToken(req), req.url)
        }
      })

      registerMediaRoute('/tracks/:id/data', services.media.getTrackData)
      registerMediaRoute(
        '/tracks/:id/media/:count',
        services.media.getTrackMedia
      )
      registerMediaRoute(
        '/artists/:id/media/:count',
        services.media.getArtistMedia
      )
      registerMediaRoute(
        '/albums/:id/media/:count',
        services.media.getAlbumMedia
      )

      server.get('/media', async ({ query: { path } }, reply) => {
        return (await services.media.isMediaAllowed(path))
          ? reply.sendFile(basename(path), dirname(path))
          : reply.code(403).send()
      })

      server.post(
        '/logs',
        {
          schema: S.object().prop(
            'logs',
            S.array()
              .items(
                S.object().prop('level', S.string()).prop('args', S.array())
              )
              .required()
          )
        },
        ({ body }, reply) => {
          reportUiLogs(body)
          reply.send()
        }
      )

      function registerMediaRoute(route, retriever) {
        server.get(route, async ({ params: { id, count } }, reply) => {
          const path = await retriever(id, count && +count)
          return path
            ? reply.sendFile(basename(path), dirname(path))
            : reply.code(404).send()
        })
      }
    })

    server.post('/token', ({ body: totp, url }, reply) => {
      if (TOTP.validate({ token: totp ?? '', window: 1 }) === null) {
        logger.debug({ totp, url }, `failed to verify TOTP`)
        const error = new Error('Invalid TOTP')
        error.statusCode = 401
        throw error
      }
      const token = server.jwt.sign({})
      logger.debug({ totp, url, token }, `TOTP valid, sending new token`)
      reply.send(token)
    })

    function verifyToken(token, url) {
      try {
        server.jwt.verify(token)
      } catch (error) {
        logger.debug(
          { token, url, error },
          `failed to verify token: ${error.message}`
        )
        // fastify will automatically use this code
        error.statusCode = 403
        throw error
      }
    }

    function extractToken({ cookies }) {
      return cookies.token
    }

    function handleConnection(connection, { id, ip, url, query: { token } }) {
      let sendTokenTimeout
      let keepAliveTimeout
      logger.info({ id, ip }, `opens WS connection for ${id}`)

      // Establishes connection first, then validates token.
      // This allows returning a reason for rejecting connection, allowing the
      // client to distinguish flaky network from outdated JWT.
      // Validating as part of `upgrade` or with `preValidation` hook does not allow this.
      if (!isLocalhost(ip)) {
        logger.debug({ id, ip, token }, `verifying new connection`)
        try {
          if (!token) {
            const error = new Error('Missing token')
            error.statusCode = 401
            throw error
          }
          verifyToken(token, url)
        } catch (error) {
          logger.debug(
            { id, ip, token, error },
            `failed to establish connection`
          )
          sendToWS({ error: error.message, code: error.statusCode })
          connection.socket.close()
          return
        }
      }

      sendNewToken({ settings })

      ping()

      connection.socket.on('close', () => {
        clearTimeout(sendTokenTimeout)
        clearTimeout(keepAliveTimeout)
        logger.info({ id, ip }, `closes WS connection for ${id}`)
      })

      connection.socket.on('message', async function handleMessage(rawData) {
        try {
          const data = JSON.parse(rawData)
          checkPayload(data)
          server.jwt.verify(data.token)
          const [name, op] = data.invoked.split('.')
          try {
            if (!(name in services) || !(op in services[name])) {
              throw new Error(`core doesn't support ${name}.${op}()`)
            } else {
              const result = await services[name][op](...(data.args || []))
              sendToWS({ id: data.id, result })
            }
          } catch (error) {
            logger.error({ id, ip, error, data }, error.message)
            sendToWS({ id: data.id, error: error.message })
          }
        } catch (error) {
          logger.error(
            { id, ip, error, rawData },
            `can not process message: ${error.message}`
          )
          sendToWS({ error: error.message })
        }
      })

      function sendToWS(data) {
        connection.socket.send(JSON.stringify(data), error => {
          if (error) {
            logger.error(
              { id, ip, error },
              `can not send message to client: ${error.message}`
            )
          }
        })
      }

      function sendNewToken(extraData = {}) {
        logger.info({ id, ip }, 'send new token to connected client')
        sendToWS({ token: server.jwt.sign({}), ...extraData })
        sendTokenTimeout = setTimeout(
          sendNewToken,
          (JWTExpiryInSeconds - 30) * 1000
        )
      }

      function ping() {
        connection.socket.ping()
        keepAliveTimeout = setTimeout(ping, keepAliveInSeconds * 1000)
      }
    }

    return server.listen({
      port: port || settings.broadcastPort,
      host: settings.isBroadcasting ? '0.0.0.0' : 'localhost'
    })
  }

  async function close() {
    messageBus.removeListener('settings-saved', handleSavedSettings)
    // force close all connected sockets to avoid closing them after pino worker has exited
    for (const client of server.websocketServer.clients) {
      client.emit('close')
      client.removeAllListeners('close')
      client.close()
    }
    await server?.close()
    server = null
  }

  function handleSavedSettings(savedSettings) {
    const needRestart = settings.isBroadcasting !== savedSettings.isBroadcasting
    settings = savedSettings
    if (needRestart) {
      // delay restart so UI could get new values
      setTimeout(async () => {
        server.close()
        startServer()
      }, 100)
    }
  }

  function checkPayload(data) {
    if (!validate(data)) {
      const reason = `Validation errors:\n${ajv.errorsText(validate.errors, {
        separator: '\n'
      })}`
      logger.error({ data, reason }, `unsupported message received`)
      const error = new Error(reason)
      error.statusCode = 400
      throw error
    }
  }

  function reportUiLogs(data) {
    for (const log of data.logs) {
      uiLogger[log.level]({ time: log.time }, ...log.args)
    }
  }

  return { address: await startServer(), close, server, totp: TOTP }
}

/**
 * Sends an event to all registered clients, and on the message bus
 * @param {string} event  - event name
 * @param {any} args      - optional arguments
 * @throws {error} when connection has not been started
 */
export const broadcast = function (event, args) {
  if (!server) {
    throw new Error(`unstarted connection, call subscribeRemote() first`)
  }
  messageBus.emit(event, args)
  if (server.websocketServer?.clients) {
    for (const client of server.websocketServer.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ event, args }))
      }
    }
  }
}

function isLocalhost(ip) {
  // https://github.com/stdlib-js/assert-is-localhost/blob/main/lib/main.js#L29
  return (
    ip === '[::1]' ||
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/.test(ip)
  )
}
