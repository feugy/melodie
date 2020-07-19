'use strict'

const electron = require('electron')

exports.subscribeRemote = function (services = electron) {
  electron.ipcMain.handle('remote', async (event, module, fn, ...args) => {
    if (!(module in services) || !(fn in services[module])) {
      throw new Error(`electron doesn't support ${module}.${fn}()`)
    }
    // const s = Date.now()
    const result = await services[module][fn](...args)
    // console.log(`${module}.${fn}(${args.join(', ')}): ${Date.now() - s}`)
    return result
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
