'use strict'

const { dialog } = require('electron')
const { extname } = require('path')
const fs = require('fs-extra')
const { of, Observable, forkJoin, from, merge, EMPTY } = require('rxjs')
const {
  mergeMap,
  filter,
  reduce,
  bufferCount,
  endWith,
  map,
  partition,
  tap
} = require('rxjs/operators')
const { uniq } = require('lodash')
const chokidar = require('chokidar')
const klaw = require('klaw')
const { hash, broadcast } = require('../utils')
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
      }).pipe(filter(onlySupported))
    }, walkConcurrency)
  )
}

function onlySupported({ path, stats }) {
  return (
    (!stats || stats.isFile()) &&
    supported.includes(extname(path).toLowerCase())
  )
}

function makeEnrichAndSavePipeline(bufferSize = saveThreshold) {
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
    bufferCount(bufferSize),
    mergeMap(saved => from(lists.add(saved))),
    reduce((tracks, saved) => tracks.concat(saved), [])
  ]
}

module.exports = {
  async addFolders() {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory', 'multiSelections']
    })
    if (filePaths.length) {
      const settings = await settingsModel.get()
      await settingsModel.save({
        ...settings,
        folders: uniq(settings.folders.concat(filePaths))
      })
      broadcast('tracking', { inProgress: true, op: 'addFolders' })
      this.watch(filePaths)
      return walk(filePaths)
        .pipe(
          ...makeEnrichAndSavePipeline(),
          tap(() =>
            broadcast('tracking', { inProgress: false, op: 'addFolders' })
          )
        )
        .toPromise()
    }
    return []
  },

  async compare(folders) {
    const existingIds = await tracksModel.listWithTime()
    broadcast('tracking', { inProgress: true, op: 'compare' })
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
        }),
        tap(() => broadcast('tracking', { inProgress: false, op: 'compare' }))
      )
      .toPromise()
  },

  watch(folders) {
    const [additions, removals] = Observable.create(function (observer) {
      function onSave(path) {
        observer.next({ isSave: true, path })
      }
      function onRemove(path) {
        observer.next({ isSave: false, path })
      }
      const watcher = chokidar
        .watch(folders, {
          ignoreInitial: true,
          disableGlobbing: true,
          awaitWriteFinish: {
            stabilityThreshold: 200,
            pollInterval: 100
          }
        })
        .on('add', onSave)
        .on('change', onSave)
        .on('unlink', onRemove)
        .on('error', observer.error.bind(observer))
      return {
        unsubscribe() {
          watcher.close()
        }
      }
    }).pipe(partition(({ isSave }) => isSave))

    return merge(
      additions.pipe(
        mergeMap(({ path }) =>
          from(fs.stat(path)).pipe(map(stats => ({ path, stats })))
        ),
        filter(onlySupported),
        ...makeEnrichAndSavePipeline(1)
      ),
      removals.pipe(
        filter(onlySupported),
        mergeMap(({ path }) => from(lists.remove([hash(path)])))
      )
    ).subscribe()
  }
}
