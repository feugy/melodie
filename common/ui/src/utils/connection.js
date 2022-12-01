'use strict'

import { BehaviorSubject, firstValueFrom } from 'rxjs'
import { filter, map, take } from 'rxjs/operators'
import { nanoid } from 'nanoid'

let ws = null
let rootUrl = null
let token = null
const messages$ = new BehaviorSubject({})
const lastInvokation$ = new BehaviorSubject()
const connectionTimeout = 2000

/**
 * Enhanced an URL with prefix and security token
 * @param {string} url? - url to be enhanced
 * @returns {string|null} - enhenced url, if any
 */
export function enhanceUrl(url) {
  if (!url || !rootUrl) {
    return null
  }
  const resultUrl = new URL(url, rootUrl)
  if (token) {
    resultUrl.searchParams.set('token', token)
  }
  return resultUrl.toString()
}

/**
 * Connects to the server's Websocket.
 * Does nothing if connection is already live.
 * @async
 * @param {string} address                - WebService url to connect to
 * @param {string} jwt                    - optional authentication token
 * @param {function} handleConnectionLost - function called when connection is lost
 * @param {function} handleNewToken       - function called when receiving a new token from server
 * @throws {err} if connection can not been established
 */
export async function initConnection(
  address,
  jwt,
  handleConnectionLost,
  handleNewToken
) {
  if (ws) {
    if ([WebSocket.CONNECTING, WebSocket.OPEN].includes(ws.readyState)) {
      throw new Error(`connection already established, close it first`)
    }
    closeConnection()
  }
  token = jwt
  rootUrl = address.replace(/^ws/, 'http')

  let connectionAlreadyLost = false
  let settings = null

  function updateToken(value) {
    token = value
    handleNewToken(value)
  }

  const callConnectionLostHandler = error => {
    closeConnection()
    if (!connectionAlreadyLost) {
      connectionAlreadyLost = true
      handleConnectionLost(error)
    }
  }

  try {
    ws = await new Promise((resolve, reject) => {
      try {
        const socket = new WebSocket(`${address}/ws?token=${token}`)
        const clear = () => {
          clearTimeout(timeout)
          socket.onopen = null
        }

        socket.onclose = () => {
          clear()
          reject(new Error(`failed to establish connection`))
        }

        socket.onmessage = ({ data }) => {
          clear()
          try {
            const payload = JSON.parse(data)
            updateToken(payload.token)
            settings = payload.settings
            socket.onmessage = undefined
            resolve(socket)
          } catch (err) {
            const error = new Error(
              `Failed to receive token from server: ${err.message}`
            )
            console.error(error, data)
            reject(error)
          }
        }
        const timeout = setTimeout(() => {
          clear()
          socket.close()
          reject(new Error(`failed to establish connection: timeout`))
        }, connectionTimeout)
      } catch (err) {
        reject(new Error(`failed to establish connection: ${err.message}`))
      }
    })

    ws.onmessage = ({ data }) => {
      try {
        const payload = JSON.parse(data)
        if (payload.token) {
          updateToken(payload.token)
        } else {
          messages$.next(payload)
        }
      } catch (err) {
        console.error(
          `Failed to read server message: ${err.message}`,
          err,
          data
        )
      }
    }

    ws.onclose = () => {
      callConnectionLostHandler()
    }
  } catch (err) {
    callConnectionLostHandler(err)
  }
  return settings
}

/**
 * Disconnects from the server's Websocket.
 * Does nothing if no connection is established
 */
export function closeConnection() {
  if (ws) {
    ws.onclose = null
    ws.close()
  }
  rootUrl = ''
  ws = null
}

/**
 * Sends an individual message to the server.
 * Useful to send errors.
 * @param {object} data - stringifiable data sent to server
 * @param {boolean} failOnError - false to not throw errors on missing connection. Usefull when reporting errors while being offline
 * @throws {err} when connection has not been initialized yet
 */
export function send(data, failOnError = true) {
  if (!ws) {
    if (failOnError) {
      throw new Error(`unestablished connection, call initConnection() first`)
    }
  } else {
    lastInvokation$.next(data)
    ws.send(JSON.stringify({ ...data, token })) // TODO use safe-stringify
  }
}

/**
 * @yields {object} last invoked server method, with `invoked` , `args` and `id`
 */
export const lastInvokation = lastInvokation$.asObservable()

/**
 * Asynchronously invokes a function from a server service.
 * @async
 * @param {string} invoked - invoked service and function names: 'settings.get'
 * @param  {...any} args - arguments passed to the service function
 * @returns {any} service function result
 * @throws {err} when connection has not been initialized yet
 */
export async function invoke(invoked, ...args) {
  const id = nanoid()
  send({ invoked, args, id })
  return firstValueFrom(
    messages$.pipe(
      filter(msg => msg.id === id),
      take(1),
      map(({ result, error }) => {
        if (error) {
          throw new Error(error)
        }
        return result
      })
    )
  )
}

const observables = new Map()

/**
 * Makes an observable from server events.
 * @param {string} name - name of the server event to listen to
 * @returns {Observable} an observable emitting events received from server
 */
export function fromServerEvent(name) {
  if (!observables.has(name)) {
    observables.set(
      name,
      messages$.pipe(
        filter(msg => msg.event === name),
        map(msg => msg.args)
      )
    )
  }
  return observables.get(name)
}
