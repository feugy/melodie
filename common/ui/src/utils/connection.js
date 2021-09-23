'use strict'

import { BehaviorSubject } from 'rxjs'
import { filter, map, pluck, take } from 'rxjs/operators'
import { nanoid } from 'nanoid'

let ws
const messages$ = new BehaviorSubject({})

/**
 * Connects to the server's Websocket.
 * Does nothing if connection is already live.
 * @async
 * @param {string} address            - WebService url to connect to
 * @param {function} onConnectionLost - function called when connection is lost
 * @throws {err} if connection can not been established
 */
export async function initConnection(address, onConnectionLost) {
  if (ws && [WebSocket.CONNECTING, WebSocket.OPEN].includes(ws.readyState)) {
    throw new Error(`connection already established, close it first`)
  }

  ws = await new Promise((resolve, reject) => {
    try {
      const socket = new WebSocket(`${address}/ws`)
      socket.onopen = () => {
        socket.onopen = null
        socket.onerror = null
        resolve(socket)
      }
      socket.onerror = err => {
        socket.onopen = null
        socket.onerror = null
        reject(new Error(`failed to establish connection: ${err.message}`))
      }
    } catch (err) {
      reject(new Error(`failed to establish connection: ${err.message}`))
    }
  })

  ws.onmessage = ({ data }) => {
    try {
      messages$.next(JSON.parse(data))
    } catch (err) {
      console.error(`Failed to read server message: ${err.message}`, err, data)
    }
  }

  ws.onclose = () => {
    closeConnection()
    onConnectionLost()
  }
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
    ws.send(
      JSON.stringify(
        data.error
          ? { error: { message: data.error.message, stack: data.error.stack } }
          : data
      )
    ) // TODO use safe-stringify
  }
}

const lastInvokation$ = new BehaviorSubject()
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
  return messages$
    .pipe(
      filter(msg => msg.id === id),
      take(1),
      map(({ result, error }) => {
        if (error) {
          throw new Error(error)
        }
        return result
      })
    )
    .toPromise()
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
        pluck('args')
      )
    )
  }
  return observables.get(name)
}