'use strict'

const { app } = require('electron')
const { join } = require('path')

const appPath = app.getAppPath('userData')
const folder = 'indices'

exports.getIndexPath = function (index) {
  return join(appPath, folder, `${index}.json`)
}
