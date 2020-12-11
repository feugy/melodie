'use strict'

const { app } = require('electron')
const { join, extname, dirname } = require('path')
const { Observable } = require('rxjs')
const klaw = require('klaw')

/**
 * Logs are stored in a file, withing the application's own folders.
 * The file name is logs.txt
 * @returns {string} full path to the log file, according to Electron
 */
exports.getLogPath = function () {
  return join(app.getPath('logs') || '', `logs.txt`)
}

/**
 * Computes full path to a file the application can write into, inside user data folders.
 * @param {string} file - name of the desired file.
 * @returns {string} full path to that file
 */
exports.getStoragePath = function (file) {
  return join(app.getPath('userData'), `${file}`)
}

/**
 * Computes full path to the file storing a model's media, inside user pictures.
 * The file name is the model id (no extension) within a `melodie-media` folder
 * @param {number} id - model's id.
 * @returns {string} full path to that media (without extension)
 */
exports.getMediaPath = function (id) {
  return join(app.getPath('pictures'), 'melodie-media', `${id}`)
}

/**
 * Creates an observable that walk all files within a given path, including nested folders
 * The emitted values are full paths
 * @param {string} path - path to walk
 * @returns {Observable} emitting file full paths
 */
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

/**
 * @typedef {object} MergeResult
 * @property {array<string>} merged - list of unique result paths
 * @property {array<string>} added - list of distinct added path
 */

/**
 * Merges a given path into a list of paths, ensuring uniqueness, and considering ascendance.
 * @param {array<string>} added - paths added to the list
 * @param {array<string>} list - list of path to add to
 * @returns {MergeResult} result objects with:
 */
exports.mergePaths = function (added, list) {
  const distinctAdded = exports.excludeDescendants(added, list)
  const distinctExisting = exports.excludeDescendants(list, distinctAdded)
  return {
    merged: distinctExisting.concat(distinctAdded),
    added: distinctAdded
  }
}

/**
 * Extract unique paths to parent folders from a list of entries.
 * @param {array<string>} entries - list of files/folders
 * @returns {array<string>} list of unique paths
 */
exports.dirPaths = function (entries) {
  const unique = new Set()
  for (const entry of entries) {
    unique.add(extname(entry) ? dirname(entry) : entry)
  }
  return [...unique]
}

/**
 * Excludes paths which are descendants of others
 * @param {array<string>} paths     - list of path to filter
 * @param {array<string>} ancestors - list of ancestors
 * @returns {array<string>} paths that are not descendants of provided ancestors
 */
exports.excludeDescendants = function (paths, ancestors) {
  return paths.filter(
    folder => !ancestors.some(parent => folder.startsWith(parent))
  )
}
