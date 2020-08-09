'use strict'

const { extname, basename } = require('path')
const { of } = require('rxjs')
const {
  mergeMap,
  filter,
  pluck,
  reduce,
  take,
  defaultIfEmpty
} = require('rxjs/operators')
const mime = require('mime-types')
const AbstractProvider = require('../abstract-provider')
const { settingsModel } = require('../../models')
const { parentName, walk } = require('../../utils')

const walkConcurrency = 2

class Local extends AbstractProvider {
  constructor() {
    super('Local')
  }

  async findArtistArtwork() {
    return []
  }

  async findAlbumCover(searched) {
    this.logger.debug({ searched }, `search album cover for ${searched}`)
    try {
      const { folders } = await settingsModel.get()
      const searchedClean = searched.toLowerCase().trim()
      const results = await of(...folders)
        .pipe(
          mergeMap(
            folder =>
              walk(folder).pipe(
                filter(
                  ({ path, stats }) =>
                    stats.isDirectory() &&
                    basename(path)
                      .toLocaleLowerCase()
                      .trim()
                      .includes(searchedClean)
                ),
                pluck('path'),
                take(1)
              ),
            walkConcurrency
          ),
          mergeMap(folder =>
            walk(folder).pipe(
              filter(({ path, stats }) => {
                if (stats.isFile() && parentName(path)) {
                  const type = mime.lookup(extname(path))
                  return (
                    type === 'image/jpeg' ||
                    type === 'image/gif' ||
                    type === 'image/png' ||
                    type === 'image/bmp'
                  )
                }
                return false
              }),
              pluck('path'),
              reduce(
                (results, path) => [
                  ...results,
                  { full: path, preview: path, provider: this.name }
                ],
                []
              )
            )
          ),
          defaultIfEmpty([])
        )
        .toPromise()
      this.logger.debug(
        { length: results.length, searched },
        `got results for ${searched}`
      )
      return results
    } catch (err) {
      this.logger.error(
        { err, searched },
        `failed to search album cover: ${err.message}`
      )
      return []
    }
  }
}

module.exports = new Local()
