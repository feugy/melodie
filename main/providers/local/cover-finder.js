'use strict'

const fs = require('fs-extra')
const { join, extname, dirname } = require('path')
const { filter, pluck, reduce } = require('rxjs/operators')
const mime = require('mime-types')
const { tracksModel } = require('../../models')
const { walk } = require('../../utils')

const coverFiles = [
  'cover.jpeg',
  'Cover.jpeg',
  'cover.jpg',
  'Cover.jpg',
  'cover.png',
  'Cover.png',
  'cover.gif',
  'Cover.gif',
  'folder.jpeg',
  'Folder.jpeg',
  'folder.jpg',
  'Folder.jpg',
  'folder.png',
  'Folder.png',
  'folder.gif',
  'Folder.gif'
]

module.exports = {
  async findInFolder(path) {
    // path could either be a folder or a file
    const folder = extname(path) ? dirname(path) : path
    for (const fileName of coverFiles) {
      const file = join(folder, fileName)
      try {
        await fs.access(file, fs.constants.R_OK)
        return file
      } catch {
        // ignore missing file
      }
    }
    return null
  },

  async findForAlbum(album) {
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
        reduce(
          (results, path) => [...results, { cover: path, provider: 'Local' }],
          []
        )
      )
      .toPromise()
  }
}
