'use strict'

const electron = require('electron')
const { getLogger } = require('./logger')

const logger = getLogger('renderer')

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

const renderers = []

exports.registerRenderer = function (renderer) {
  if (renderers.indexOf(renderer) === -1) {
    renderers.push(renderer)
  }
}

exports.unregisterRenderer = function (renderer) {
  const idx = renderers.indexOf(renderer)
  if (idx !== -1) {
    renderers.splice(idx, 1)
  }
}

exports.broadcast = function (...args) {
  for (const renderer of renderers) {
    renderer.webContents.send(...args)
  }
}
