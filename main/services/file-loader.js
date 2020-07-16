'use strict'

const { dialog } = require('electron')
const klaw = require('klaw')
const { extname } = require('path')
const { of, Observable, forkJoin, from } = require('rxjs')
const {
  mergeMap,
  filter,
  reduce,
  pluck,
  bufferCount
} = require('rxjs/operators')
const { hash } = require('../utils')
const tag = require('./tag-reader')
const covers = require('./cover-finder')
const lists = require('./list-engine')

const readConcurrency = 10
const walkConcurrency = 2
const saveThreshold = 50
const supported = ['.mp3', '.ogg', '.flac']

const walk = folders =>
  of(...folders).pipe(
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
        ),
        pluck('path')
      )
    }, walkConcurrency)
  )

module.exports = {
  async chooseFolders() {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory', 'multiSelections']
    })
    return filePaths
  },

  async crawl(folders) {
    if (!folders || folders.length === 0) {
      return null
    }
    return walk(folders)
      .pipe(
        mergeMap(
          path =>
            forkJoin({
              id: of(hash(path)),
              path: of(path),
              tags: from(tag.read(path)),
              media: from(covers.findFor(path))
            }),
          readConcurrency
        ),
        bufferCount(saveThreshold),
        mergeMap(saved => from(lists.add(saved))),
        reduce((tracks, saved) => tracks.concat(saved), [])
      )
      .toPromise()
  }
}
