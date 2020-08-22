'use strict'

const { extname } = require('path')
const fs = require('fs-extra')
const { of, Observable, forkJoin, from, merge, EMPTY } = require('rxjs')
const {
  mergeMap,
  filter,
  reduce,
  bufferCount,
  map,
  partition,
  tap,
  share
} = require('rxjs/operators')
const chokidar = require('chokidar')
const { hash, broadcast, getLogger, walk } = require('../utils')
const tag = require('./tag-reader')
const covers = require('./cover-finder')
const lists = require('./list-engine')
const { tracksModel } = require('../models/tracks')

const readConcurrency = 10
const walkConcurrency = 2
const saveThreshold = 50
const supported = ['.mp3', '.ogg', '.flac']

const logger = getLogger('services/file')

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
    mergeMap(saved => from(lists.add(saved)).pipe(reduce(acc => acc, saved))),
    reduce((tracks, saved) => tracks.concat(saved), [])
  ]
}

const subscriptions = new Map()

module.exports = {
  async walkAndWatch(folders) {
    const startMs = Date.now()
    broadcast('tracking', { inProgress: true, op: 'addFolders' })
    this.watch(folders)
    return of(...(folders || []))
      .pipe(
        mergeMap(
          folder => walk(folder).pipe(filter(onlySupported)),
          walkConcurrency
        )
      )
      .pipe(
        ...makeEnrichAndSavePipeline(),
        tap(tracks => {
          broadcast('tracking', { inProgress: false, op: 'addFolders' })
          logger.info(
            { folders, hitCount: tracks.length },
            `folder succesfully added in ${Date.now() - startMs}ms`
          )
        })
      )
      .toPromise()
  },

  async compare(folders) {
    const startMs = Date.now()
    logger.info({ folders }, `comparing folders...`)
    const existingIds = await tracksModel.listWithTime()
    broadcast('tracking', { inProgress: true, op: 'compare' })
    return of(...(folders || []))
      .pipe(
        mergeMap(
          folder => walk(folder).pipe(filter(onlySupported)),
          walkConcurrency
        )
      )
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
          return (removedIds.length
            ? from(lists.remove(removedIds))
            : EMPTY
          ).pipe(reduce(r => r, { saved, removedIds }))
        }),
        tap(({ saved, removedIds }) => {
          broadcast('tracking', { inProgress: false, op: 'compare' })
          logger.info(
            {
              folders,
              hits: {
                savedCount: saved.length,
                removedCount: removedIds.length
              }
            },
            `folder succesfully compared in ${Date.now() - startMs}ms`
          )
        })
      )
      .toPromise()
  },

  watch(folders) {
    for (const folder of Array.isArray(folders) ? folders : [folders]) {
      const [additions, removals] = Observable.create(function (observer) {
        function onSave(path) {
          logger.debug({ path }, 'file change watched')
          observer.next({ isSave: true, path })
        }
        function onRemove(path) {
          logger.debug({ path }, 'file deletion watched')
          observer.next({ isSave: false, path })
        }
        logger.info({ folder }, `starting watch`)
        const watcher = chokidar
          .watch(folder, {
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
            logger.info({ folder }, `watcher stopped`)
          }
        }
      }).pipe(
        share(),
        partition(({ isSave }) => isSave)
      )

      subscriptions.set(
        folder,
        merge(
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
      )
    }
  },

  unwatch(folders) {
    for (const folder of Array.isArray(folders) ? folders : [folders]) {
      if (subscriptions.has(folder)) {
        subscriptions.get(folder).unsubscribe()
        subscriptions.delete(folder)
      }
    }
  },

  releaseSubscriptions() {
    for (const [, sub] of subscriptions) {
      sub.unsubscribe()
    }
    subscriptions.clear()
  }
}
