'use strict'

const { dialog } = require('electron')
const klaw = require('klaw')
const { extname } = require('path')
const { of, Observable, forkJoin, from, EMPTY } = require('rxjs')
const {
  mergeMap,
  filter,
  reduce,
  bufferCount,
  endWith
} = require('rxjs/operators')
const { uniq } = require('lodash')
const { hash } = require('../utils')
const tag = require('./tag-reader')
const covers = require('./cover-finder')
const lists = require('./list-engine')
const { tracksModel } = require('../models/tracks')
const { settingsModel } = require('../models/settings')

const readConcurrency = 10
const walkConcurrency = 2
const saveThreshold = 50
const supported = ['.mp3', '.ogg', '.flac']

function walk(folders) {
  return of(...(folders || [])).pipe(
    mergeMap(path => {
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
      }).pipe(
        filter(
          item =>
            item.stats.isFile() &&
            supported.includes(extname(item.path).toLowerCase())
        )
      )
    }, walkConcurrency)
  )
}

function makeEnrichAndSavePipeline() {
  return [
    mergeMap(
      ({ path, stats: { mtimeMs } }) =>
        forkJoin({
          id: of(hash(path)),
          path: of(path),
          tags: from(tag.read(path)),
          media: from(covers.findFor(path)),
          mtimeMs: of(mtimeMs)
        }),
      readConcurrency
    ),
    bufferCount(saveThreshold),
    mergeMap(saved => from(lists.add(saved))),
    reduce((tracks, saved) => tracks.concat(saved), [])
  ]
}

module.exports = {
  async chooseFolders() {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory', 'multiSelections']
    })
    if (filePaths.length) {
      const settings = await settingsModel.get()
      await settingsModel.save({
        ...settings,
        folders: uniq(settings.folders.concat(filePaths))
      })
    }
    return filePaths
  },

  async crawl(folders) {
    return walk(folders)
      .pipe(...makeEnrichAndSavePipeline())
      .toPromise()
  },

  async compare(folders) {
    const existingIds = await tracksModel.listWithTime()
    return walk(folders)
      .pipe(
        filter(({ path, stats: { mtimeMs } }) => {
          const id = hash(path)
          const knownTime = existingIds.get(id)
          existingIds.delete(id)
          if (!knownTime || knownTime < mtimeMs) {
            return true
          }
          return false
        }),
        ...makeEnrichAndSavePipeline(),
        mergeMap(saved => {
          const removedIds = Array.from(existingIds.keys())
          return from(
            removedIds.length ? lists.remove(removedIds) : EMPTY
          ).pipe(endWith({ saved, removedIds }))
        })
      )
      .toPromise()
  }
}
