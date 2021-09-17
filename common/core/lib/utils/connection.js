'use strict'

const { dirname, basename } = require('path')
const { EventEmitter } = require('events')
const fastify = require('fastify')
const compressPlugin = require('fastify-compress')
const staticPlugin = require('fastify-static')
const websocketPlugin = require('fastify-websocket')
const Ajv = require('ajv').default
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
        invoked: { type: 'string' },
        id: { type: 'string' },
        args: { type: 'array' },
        additionnalProperties: false
      },
      required: ['invoked', 'id']
    }
  ]
})

const maxAge = 1000 * 60 * 60 * 24 * 2

/**
 * Message bus to receive events internally.
 */
exports.messageBus = new EventEmitter()
exports.messageBus.setMaxListeners(10000)

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
 * @returns {object} result object with `address` property and `close` function a function to stop the connection
 * @throws {error} when connection has already been started
 */
exports.initConnection = async function (services, publicFolder, port = 0) {
  if (server) {
    throw new Error(`connection already started, stop it first`)
  }

  let settings = await services.settings.get()

  const handleSavedSettings = savedSettings => {
    const needRestart = settings.isBroadcasting !== savedSettings.isBroadcasting
    settings = savedSettings
    if (needRestart) {
      // delay restart so UI could get new values
      setTimeout(() => {
        server.close()
        startServer()
      }, 100)
    }
  }

  exports.messageBus.on('settings-saved', handleSavedSettings)

  function handleConnection(client) {
    client.socket.on('message', async function handleMessage(rawData) {
      try {
        const data = JSON.parse(rawData)
        if (!validate(data)) {
          const reason = ajv.errorsText(validate.errors)
          logger.error({ data, reason }, `unsupported message received`)
          return
        }
        if (data.error) {
          logger.error(data, `UI error: ${JSON.stringify(data.error)}`)
          return
        }
        if (data.warn) {
          logger.warn(data, `UI warning: ${JSON.stringify(data.warn)}`)
          return
        }
        const [name, op] = data.invoked.split('.')
        try {
          if (!(name in services) || !(op in services[name])) {
            throw new Error(`core doesn't support ${name}.${op}()`)
          } else {
            const result = await services[name][op](...(data.args || []))
            client.socket.send(JSON.stringify({ id: data.id, result }))
          }
        } catch (err) {
          logger.error({ data, err }, err.message)
          client.socket.send(
            JSON.stringify({ id: data.id, error: err.message })
          )
        }
      } catch (err) {
        logger.error({ rawData }, `unparseable message: ${err.message}`)
      }
    })
  }

  async function startServer() {
    server = fastify({ logger, disableRequestLogging: true })
    server.register(websocketPlugin, { handle: handleConnection })
    server.register(compressPlugin)
    server.register(staticPlugin, {
      root: publicFolder,
      wildcard: false,
      serve: settings.isBroadcasting,
      maxAge: maxAge,
      immutable: true,
      cacheControl: true
    })
    function makeMediaHandler(retriever) {
      return async ({ params: { id, count } }, reply) => {
        const path = await retriever(id, count && +count)
        return path
          ? reply.sendFile(basename(path), dirname(path))
          : reply.code(404).send()
      }
    }
    server.get(
      '/tracks/:id/data',
      makeMediaHandler(services.media.getTrackData)
    )
    server.get(
      '/tracks/:id/media/:count',
      makeMediaHandler(services.media.getTrackMedia)
    )
    server.get(
      '/artists/:id/media/:count',
      makeMediaHandler(services.media.getArtistMedia)
    )
    server.get(
      '/albums/:id/media/:count',
      makeMediaHandler(services.media.getAlbumMedia)
    )
    const address = await server.listen(
      port || settings.broadcastPort,
      settings.isBroadcasting ? '0.0.0.0' : 'localhost'
    )
    return address
  }

  function close() {
    exports.messageBus.removeListener('settings-saved', handleSavedSettings)
    server?.close()
    server = null
  }
  return { address: await startServer(), close }
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
      // 1 is OPEN
      if (client.readyState === 1) {
        client.send(JSON.stringify({ event, args }))
      }
    }
  }
}
