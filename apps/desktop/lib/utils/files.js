'use strict'

const { join } = require('path')
const { app } = require('electron')

/**
 * Computes full path to a file the application can write into, inside user data folders.
 * @param {string} file - name of the desired file.
 * @returns {string} full path to that file
 */
exports.getStoragePath = function (file) {
  return join(app.getPath('userData'), `${file}`)
}
