'use strict'

const { app } = require('electron')
const { join } = require('path')

exports.getStoragePath = function (file) {
  return join(app.getPath('userData'), `${file}`)
}

exports.getMediaPath = function (id) {
  return join(app.getPath('userData'), 'media', `${id}`)
}
