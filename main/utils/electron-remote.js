'use strict'
const electron = require('electron')

module.exports = function () {
  electron.ipcMain.handle('remote', async (event, module, fn, ...args) => {
    if (!(module in electron) || !(fn in electron[module])) {
      throw new Error(`electron doesn't support ${module}.${fn}()`)
    }
    return electron[module][fn](...args)
  })

  return function () {
    electron.ipcMain.removeHandler('remote')
  }
}
