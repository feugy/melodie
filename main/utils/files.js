'use strict'

const { app } = require('electron')
const { join } = require('path')

const appPath = app.getAppPath('userData')
const folder = 'indices'

exports.getStoragePath = function (file) {
  return join(appPath, folder, `${file}`)
}
