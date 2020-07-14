'use strict'

const electron = require('electron')

exports.subscribeRemote = function (services = electron) {
  electron.ipcMain.handle('remote', async (event, module, fn, ...args) => {
    if (!(module in services) || !(fn in services[module])) {
      throw new Error(`electron doesn't support ${module}.${fn}()`)
    }
    return services[module][fn](...args)
  })

  return function () {
    electron.ipcMain.removeHandler('remote')
  }
}

exports.sendRemote = electron.ipcMain.send
