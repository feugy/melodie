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
let server
const ajv = new Ajv({ allErrors: true })
const validate = ajv.compile({
  oneOf: [
    {
      type: 'object',
      properties: {
        error: { oneOf: [{ type: 'string' }, { type: 'object' }] },
        additionnalProperties: true
      },
      required: ['error']
    },
    {
      type: 'object',
      properties: {
        warn: { type: 'string' },
        additionnalProperties: true
      },
      required: ['warn']
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
 * Clients can also send their errors for logging. Error message must contain (at least) an 'error' string property
 *
 * If `settings.isBroadcasting` is true, all files from public folder will be served by an http server,
 * as well as any file present in tracked folders. Addded tracked folders will automatically be served, or removed accordingly.
 * Changing `isBroadcasting` flag is settings will restart the server to stop or start broadcasting.
 *
 * If the listening port isn't explicitly specified, `settings.broadcastPort` will be used, or if not set, the first available
 * port.
 * @async
 * @param {object} services     - services exposed: their properties are expected to be objects, and the nested keys are functions.
 * @param {string} publicFolder - relative or absolute path to the public folder served.
 * @param {number} [port = 0]   - port this server will listening to (by default uses broadcastPort from settings, or gets the first available port)
 * @returns {ConnectionResult} connection created
 * @throws {error} when connection has already been started
 */
exports.initConnection = async function (services, publicFolder, port = 0) {
  if (server) {
    throw new Error(`connection already started, stop it first`)
  }

  let settings = await services.settings.get()
  exports.messageBus.on('settings-saved', handleSavedSettings)

  const period = 30
  const tokenExpiry = '30m'

  const TOTP = new OTPAuth.TOTP({
    issuer: 'Mélodie',
    algorithm: 'SHA256',
    digits: 6,
    period,
    secret: OTPAuth.Secret.fromUTF8(settings.totpSecret)
  })

  async function startServer() {
    server = fastify({ logger, disableRequestLogging: true })

    const origin = settings.isBroadcasting ? '*' : 'http://localhost:3000'
    server.register(corsPlugin, { origin })

    server.register(jwtPlugin, {
      secret: JWTSecret,
      sign: { algorithm: JWTAlgorithm, expiresIn: tokenExpiry },
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

    server.get('/ws', { websocket: true }, handleConnection)
    registerMediaRoute('/tracks/:id/data', services.media.getTrackData)
    registerMediaRoute('/tracks/:id/media/:count', services.media.getTrackMedia)
    registerMediaRoute(
      '/artists/:id/media/:count',
      services.media.getArtistMedia
    )
    registerMediaRoute('/albums/:id/media/:count', services.media.getAlbumMedia)

    server.get('/media', async ({ query }, reply) => {
      verify(query)
      const { path } = query
      return (await services.media.isMediaAllowed(path))
        ? reply.sendFile(basename(path), dirname(path))
        : reply.code(403).send()
    })

    function registerMediaRoute(url, retriever) {
      server.get(url, async ({ params: { id, count }, query }, reply) => {
        verify(query)
        const path = await retriever(id, count && +count)
        return path
          ? reply.sendFile(basename(path), dirname(path))
          : reply.code(404).send()
      })
    }

    function verify(params) {
      try {
        server.jwt.verify(params.token)
      } catch (error) {
        // fastify will automatically use this code
        error.statusCode = 401
        throw error
      }
    }

    // note: it would be better to use 'upgrade' server event
    // to authenticate incoming WS connections, but fastify-websocket does not allow it.
    // https://github.com/websockets/ws/issues/377#issuecomment-462152231
    function verifyClient({ req }, next) {
      try {
        const { searchParams } = new URL(req.url, 'http://localhost')
        const otp = searchParams.get('totp')
        const token = searchParams.get('token')
        if (!otp && !token) {
          const error = new Error('TOTP and token are missing')
          error.statusCode = 401
          throw error
        }
        let tokenSuccess = false
        if (token) {
          try {
            verify({ token })
            tokenSuccess = true
          } catch {
            // do not fail yet, and try OTP
          }
        }
        let otpSuccess = false
        if (otp) {
          otpSuccess = TOTP.validate({ token: otp, window: 1 }) !== null
        }
        if (!otpSuccess && !tokenSuccess) {
          const error = new Error('Invalid TOTP or token')
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
        await server.close()
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
        if (isUILogMessage(data)) {
          return
        }

        request.server.jwt.verify(data.token)
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

  function isUILogMessage(data) {
    if (data.error) {
      logger.error(data, `UI error: ${JSON.stringify(data.error)}`)
      return true
    }
    if (data.warn) {
      logger.warn(data, `UI warning: ${JSON.stringify(data.warn)}`)
      return true
    }
    return false
  }

  return { address: await startServer(), close, totp: TOTP }
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
