'use strict'

const { extname, dirname } = require('path')
const { filter, pluck, reduce } = require('rxjs/operators')
const mime = require('mime-types')
const AbstractProvider = require('../abstract-provider')
const { tracksModel, albumsModel } = require('../../models')
const { walk } = require('../../utils')

function findCovers(provider) {
  return async function (album) {
    const { path } = await tracksModel.getById(album.trackIds[0])
    return walk(dirname(path))
      .pipe(
        filter(({ path, stats }) => {
          if (stats.isFile()) {
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
        reduce((results, path) => [...results, { full: path, provider }], [])
      )
      .toPromise()
  }
}

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
      const albums = await albumsModel.getByName(searched)
      if (!albums.length) {
        return []
      }
      const results = (
        await Promise.all(albums.map(findCovers(this.name)))
      ).reduce((all, items) => all.concat(items))
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
