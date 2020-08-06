'use strict'

const { app } = require('electron')
const { join, extname } = require('path')

exports.getStoragePath = function (file) {
  return join(app.getPath('userData'), `${file}`)
}

exports.getMediaPath = function (id, url) {
  return join(app.getPath('userData'), 'media', `${id}${extname(url)}`)
}
