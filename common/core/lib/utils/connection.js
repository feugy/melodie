'use strict'

const { resolve, dirname, basename } = require('path')
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
  anyOf: [
    {
      type: 'object',
      properties: {
        error: { type: 'string' },
        additionnalProperties: true
      },
      required: ['error']
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

/**
 * Exposes services and their functions through a WebSocket connection, and serve static content
 * Connection clients can invoke any service function by:
 * 1. sending a request message with 'invoked' (service and function names), 'args' (array of parameters) and 'id'
 * 2. awaiting on a response message with 'id' (same as in request message) and 'result' (any)
 *
 * Since data goes over the wire, the invoked function args and result must be serializable as strings.
 * Clients can also send their errors for logging. Error message must contain (at least) an 'error' string property
 *
 * All files from public folder will be served by an http server, as well as any file present in tracked folders
 * @async
 * @param {object} services     - services exposed: their properties are expected to be objects, and the nested keys are functions.
 * @param {string} publicFolder - relative or absolute path to the public folder served.
 * @param {number} port         - port accepting WS and http connections.
 * @returns {object} result object with `address` property and `close` function a function to stop the connection
 * @throws {error} when connection has already been started
 */
exports.initConnection = async function (services, publicFolder, port) {
  if (server) {
    throw new Error(`connection already started, stop it first`)
  }

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
          logger.error(data, `UI error: ${data.error}`)
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

  server = fastify({ logger, disableRequestLogging: true })
  server.register(websocketPlugin, { handle: handleConnection })
  const { folders } = await services.settings.get()
  // TODO should depends on settings, and be dynamic
  server.register(compressPlugin)
  server.register(staticPlugin, { root: publicFolder, wildcard: false })
  server.setNotFoundHandler(async function handleFile({ url }, reply) {
    const absolutePath = resolve(decodeURIComponent(url))
    const isAllowed = folders.some(folder => absolutePath.startsWith(folder))
    if (isAllowed) {
      logger.debug({ absolutePath }, `serve file`)
      return reply.sendFile(basename(absolutePath), dirname(absolutePath))
    }
  })

  const address = await server.listen(port, '0.0.0.0')

  return {
    address,
    close() {
      server?.close()
      server = null
    }
  }
}

/**
 * Sends an event to all registered clients
 * @param {string} event  - event name
 * @param {any} args      - optional arguments
 * @throws {error} when connection has not been started
 */
exports.broadcast = function (event, args) {
  if (!server) {
    throw new Error(`unstarted connection, call subscribeRemote() first`)
  }
  for (const client of server.websocketServer.clients) {
    // 1 is OPEN
    if (client.readyState === 1) {
      client.send(JSON.stringify({ event, args }))
    }
  }
}
