'use strict'

const { join } = require('path')
const { app } = require('electron')

process.env.LOG_LEVEL_FILE = join(app.getPath('logs'), '.levels')
process.env.LOG_DESTINATION = join(app.getPath('logs'), 'logs.txt')
process.env.ARTWORK_DESINATION = join(app.getPath('pictures'), 'melodie-media')

/**
 * Computes full path to a file the application can write into, inside user data folders.
 * @param {string} file - name of the desired file.
 * @returns {string} full path to that file
 */
exports.getStoragePath = function (file) {
  return join(app.getPath('userData'), `${file}`)
}
