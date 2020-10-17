'use strict'

const electron = require('electron')
const { getLogger } = require('./logger')

const logger = getLogger('renderer')

/**
 * Exposes services and their functions to the renderer process, on ipcMain `remote` channel.
 * It allows renderer process to invoke these functions, passing them parameters and receiving their results:
 * ```
 *   const results = await electron.ipcRenderer.invoke('remote', serviceName, funcionName, ...args)
 * ```
 *
 * The exposed function can be asynchronous, but their inputs and outputs must be serializable.
 *
 * It also listen to `error` events on ipcMain, and log them as errors from the UI.
 *
 * @param {object} services - services exposed to the renderer process:
 *                            their properties are expected to be objects, and the nested keys are functions.
 * @returns {function} a function to stop exposing services
 */
exports.subscribeRemote = function (services = electron) {
  electron.ipcMain.on('error', (event, error) => {
    logger.error(error, 'UI error')
  })

  electron.ipcMain.handle('remote', async (event, module, fn, ...args) => {
    if (!(module in services) || !(fn in services[module])) {
      logger.error({ module, fn }, `electron doesn't support ${module}.${fn}()`)
    } else {
      try {
        return await services[module][fn](...args)
      } catch (error) {
        logger.error(
          error,
          `Error while running ${module}.${fn}(${args.join(', ')})`
        )
      }
    }
  })

  return function () {
    electron.ipcMain.removeHandler('remote')
  }
}

const windows = []

/**
 * Registers a window so it could listen to broadcasted events.
 * The rendered process can listen to events with:
 * ```
 * electron.ipcRenderer.on(eventName, (event, ...args) => {})
 * ```
 * @param {BrowserWindow} window - registered as an event listener
 */
exports.registerRenderer = function (window) {
  if (windows.indexOf(window) === -1) {
    windows.push(window)
  }
}

/**
 * Unregisters a given window as an event listener.
 * @param {BrowserWindow} window - unregistered as an event listener
 */
exports.unregisterRenderer = function (window) {
  const idx = windows.indexOf(window)
  if (idx !== -1) {
    windows.splice(idx, 1)
  }
}

/**
 * Sends an event to all registered windows
 * @param {...any} args - event name and arguments
 */
exports.broadcast = function (...args) {
  for (const renderer of windows) {
    renderer.webContents.send(...args)
  }
}
