'use strict'

const { app } = require('electron')
const { join, dirname, sep } = require('path')
const { Observable } = require('rxjs')
const klaw = require('klaw')

exports.getLogPath = function () {
  return join(app.getPath('logs') || '', `logs.txt`)
}

exports.getStoragePath = function (file) {
  return join(app.getPath('userData'), `${file}`)
}

exports.getMediaPath = function (id) {
  return join(app.getPath('pictures'), 'melodie-media', `${id}`)
}

exports.parentName = function (path) {
  return dirname(path).split(sep).pop()
}

exports.walk = function (path) {
  return new Observable(function (observer) {
    klaw(path)
      .on('readable', function () {
        let item
        while ((item = this.read())) {
          observer.next(item)
        }
      })
      .on('error', observer.error.bind(observer))
      .on('end', observer.complete.bind(observer))
  })
}

exports.mergeFolders = function (added, existing) {
  const distinctAdded = added.filter(
    folder => !existing.some(parent => folder.startsWith(parent))
  )
  const distinctExisting = existing.filter(
    folder => !distinctAdded.some(parent => folder.startsWith(parent))
  )
  return distinctExisting.concat(distinctAdded)
}
