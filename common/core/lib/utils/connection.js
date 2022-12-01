'use strict'

const { randomUUID } = require('crypto')
const { dirname, basename } = require('path')
const { EventEmitter } = require('events')
const fastify = require('fastify')
const compressPlugin = require('fastify-compress')
const corsPlugin = require('fastify-cors')
const jwtPlugin = require('fastify-jwt')
const staticPlugin = require('fastify-static')
const websocketPlugin = require('fastify-websocket')
const Ajv = require('ajv').default
const OTPAuth = require('otpauth')
const WebSocket = require('ws')
const { getLogger } = require('./logger')

const logger = getLogger('connection')
const uiLogger = getLogger('ui')
let server
const ajv = new Ajv({ allErrors: true })
const validate = ajv.compile({
  oneOf: [
    {
      type: 'object',
      properties: {
        token: { type: 'string' },
        logs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'string' },
              args: { type: 'array' },
              additionnalProperties: true
            }
          }
        },
        additionnalProperties: true
      },
      required: ['token', 'logs']
    },
    {
      type: 'object',
      properties: {
        token: { type: 'string' },
        invoked: { type: 'string' },
        id: { type: 'string' },
        args: { type: 'array' },
        additionnalProperties: false
      },
      required: ['token', 'invoked', 'id']
    }
  ]
})

const maxAge = 1000 * 60 * 60 * 24 * 2
const JWTAlgorithm = 'HS512'
const JWTExpiryInSeconds = 30 * 60
// make a new secret on every Mélodie restart
const JWTSecret = randomUUID()

/**
 * Message bus to receive events internally.
 */
exports.messageBus = new EventEmitter()
exports.messageBus.setMaxListeners(10000)

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
exports.initConnection = async function (
  services,
  publicFolder,
  port = 0,
  remoteAddress = undefined
) {
  if (server) {
    throw new Error(`connection already started, stop it first`)
  }

  let settings = await services.settings.get()
  exports.messageBus.on('settings-saved', handleSavedSettings)

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
        const { socket } = request.raw
        request.raw.connection = { ...request.raw.connection, remoteAddress }
        request.raw.socket = {
          ...socket,
          address: () => ({ address: remoteAddress, family: 'IPv4', port: 443 })
        }
      })
    }

    const origin = settings.isBroadcasting ? '*' : 'http://localhost:3000'
    server.register(corsPlugin, { origin })

    server.register(jwtPlugin, {
      secret: JWTSecret,
      sign: { algorithm: JWTAlgorithm, expiresIn: `${JWTExpiryInSeconds}s` },
      verify: { algorithms: [JWTAlgorithm] }
    })

    server.register(websocketPlugin, { options: { verifyClient } })

    server.register(compressPlugin)

    server.register(staticPlugin, {
      root: publicFolder,
      wildcard: false,
      serve: settings.isBroadcasting,
      maxAge: maxAge,
      immutable: true,
      cacheControl: true
    })

    server.post('/token', ({ body: totp, url }, reply) => {
      if (TOTP.validate({ token: totp ?? '', window: 1 }) === null) {
        logger.debug({ totp, url }, `failed to verify token`)
        const error = new Error('Invalid TOTP')
        error.statusCode = 401
        throw error
      }
      reply.send(server.jwt.sign({}))
    })

    server.get('/ws', { websocket: true }, handleConnection)
    registerMediaRoute('/tracks/:id/data', services.media.getTrackData)
    registerMediaRoute('/tracks/:id/media/:count', services.media.getTrackMedia)
    registerMediaRoute(
      '/artists/:id/media/:count',
      services.media.getArtistMedia
    )
    registerMediaRoute('/albums/:id/media/:count', services.media.getAlbumMedia)

    server.get('/media', async ({ query, url, ip }, reply) => {
      verify(query, ip, url)
      const { path } = query
      return (await services.media.isMediaAllowed(path))
        ? reply.sendFile(basename(path), dirname(path))
        : reply.code(403).send()
    })

    function registerMediaRoute(route, retriever) {
      server.get(
        route,
        async ({ params: { id, count }, query, url, ip }, reply) => {
          verify(query, ip, url)
          const path = await retriever(id, count && +count)
          return path
            ? reply.sendFile(basename(path), dirname(path))
            : reply.code(404).send()
        }
      )
    }

    function verify({ token } = {}, ip, url = '') {
      if (!isLocalhost(ip)) {
        try {
          server.jwt.verify(token)
        } catch (error) {
          logger.debug(
            { token, url, error },
            `failed to verify token: ${error.message}`
          )
          // fastify will automatically use this code
          error.statusCode = 401
          throw error
        }
      }
    }

    // note: it would be better to use 'upgrade' server event
    // to authenticate incoming WS connections, but fastify-websocket does not allow it.
    // https://github.com/websockets/ws/issues/377#issuecomment-462152231
    function verifyClient({ req }, next) {
      if (isLocalhost(req.socket.address().address)) {
        return next(true)
      }
      try {
        const { searchParams } = new URL(req.url, 'http://localhost')
        const token = searchParams.get('token')
        logger.debug(
          { token, socket: req.socket.address() },
          `verifying new connection`
        )
        if (!token) {
          const error = new Error('Missing token')
          error.statusCode = 401
          throw error
        }
        try {
          verify({ token }, 'ws/')
        } catch {
          const error = new Error('Invalid token')
          error.statusCode = 403
          throw error
        }
        next(true)
      } catch (error) {
        next(false, error.statusCode, error.message)
      }
    }

    return server.listen(
      port || settings.broadcastPort,
      settings.isBroadcasting ? '0.0.0.0' : 'localhost'
    )
  }

  async function close() {
    exports.messageBus.removeListener('settings-saved', handleSavedSettings)
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

  function handleConnection(connection, request) {
    let sendTokenTimeout
    logger.debug({ id: request.id }, `opens WS connection for ${request.id}`)

    sendNewToken({ settings })

    connection.socket.on('close', () => {
      clearTimeout(sendTokenTimeout)
      logger.debug({ id: request.id }, `closes WS connection for ${request.id}`)
    })

    connection.socket.on('message', async function handleMessage(rawData) {
      try {
        const data = JSON.parse(rawData)
        checkMessageFormat(data)
        request.server.jwt.verify(data.token)
        if (handleUIMessage(data)) {
          return
        }
        const [name, op] = data.invoked.split('.')
        try {
          if (!(name in services) || !(op in services[name])) {
            throw new Error(`core doesn't support ${name}.${op}()`)
          } else {
            const result = await services[name][op](...(data.args || []))
            sendToWS({ id: data.id, result })
          }
        } catch (err) {
          logger.error({ data, err }, err.message)
          sendToWS({ id: data.id, error: err.message })
        }
      } catch (err) {
        logger.error({ rawData }, `can not process message: ${err.message}`)
        sendToWS({ error: err.message })
      }
    })

    function sendToWS(data) {
      connection.socket.send(JSON.stringify(data))
    }

    function sendNewToken(extraData = {}) {
      logger.info('send new token to connected clients')
      sendToWS({ token: server.jwt.sign({}), ...extraData })
      sendTokenTimeout = setTimeout(
        sendNewToken,
        (JWTExpiryInSeconds - 5) * 1000
      )
    }
  }

  function checkMessageFormat(data) {
    if (!validate(data)) {
      const reason = `Validation errors:\n${ajv.errorsText(validate.errors, {
        separator: '\n'
      })}`
      logger.error({ data, reason }, `unsupported message received`)
      throw new Error(reason)
    }
  }

  function handleUIMessage(data) {
    if (data.logs) {
      for (const log of data.logs) {
        uiLogger[log.level]({ time: log.time }, ...log.args)
      }
      return true
    }
    return false
  }

  return { address: await startServer(), close, server, totp: TOTP }
}

/**
 * Sends an event to all registered clients, and on the message bus
 * @param {string} event  - event name
 * @param {any} args      - optional arguments
 * @throws {error} when connection has not been started
 */
exports.broadcast = function (event, args) {
  if (!server) {
    throw new Error(`unstarted connection, call subscribeRemote() first`)
  }
  exports.messageBus.emit(event, args)
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
