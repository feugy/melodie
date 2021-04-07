'use strict'

import { dirname, resolve } from 'path'
import fastify from 'fastify'
import staticPlugin from 'fastify-static'
import * as sapper from '@sapper/server'

const { PORT, BASE_PATH } = process.env

const sapperMiddleware = sapper.middleware()

fastify()
  .register(staticPlugin, {
    root: resolve('static'),
    prefix: BASE_PATH || '/',
    wildcard: false
  })
  .register(staticPlugin, {
    root: resolve(dirname(require.resolve('@melodie/ui')), 'public', 'fonts'),
    prefix: `${BASE_PATH || ''}/fonts`,
    wildcard: false,
    decorateReply: false
  })
  // freely inspired from https://github.com/thgh/sapper-fastify-socket/blob/master/src/server.js
  .route({
    method: 'GET',
    url: `${BASE_PATH || ''}/*`,
    handler: async (request, reply) => {
      request.baseUrl = BASE_PATH
      request.raw.url = request.raw.url.replace(BASE_PATH, '')
      request.originalUrl = request.raw.url
      reply.setHeader = reply.header
      reply.writeHead = reply.code
      reply.end = reply.send

      await sapperMiddleware(request, reply, error => {
        if (error) throw error
        reply.status(404).send()
      })
      return reply
    }
  })
  .listen(PORT)
