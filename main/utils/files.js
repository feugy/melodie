'use strict'

const { app } = require('electron')
const { join, dirname, sep } = require('path')
const { Observable } = require('rxjs')
const klaw = require('klaw')

exports.getStoragePath = function (file) {
  return join(app.getPath('userData'), `${file}`)
}

exports.getMediaPath = function (id) {
  return join(app.getPath('userData'), 'media', `${id}`)
}

exports.parentName = function (path) {
  return dirname(path).split(sep).pop()
}

exports.walk = function (path) {
  return Observable.create(function (observer) {
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
