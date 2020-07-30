'use strict'

const { app } = require('electron')
const { join } = require('path')

const appPath = app.getPath('userData')

exports.getStoragePath = function (file) {
  return join(appPath, `${file}`)
}
