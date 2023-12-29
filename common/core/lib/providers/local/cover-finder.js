import fs from 'fs-extra'
import mime from 'mime-types'
import { dirname, extname, join } from 'path'
import { filter, firstValueFrom, map, reduce } from 'rxjs'

import { tracksModel } from '../../models/index.js'
import { walk } from '../../utils/index.js'

const coverFiles = [
  'cover.jpg',
  'Cover.jpg',
  'cover.jpeg',
  'Cover.jpeg',
  'cover.png',
  'Cover.png',
  'cover.gif',
  'Cover.gif',
  'folder.jpg',
  'Folder.jpg',
  'folder.jpeg',
  'Folder.jpeg',
  'folder.png',
  'Folder.png',
  'folder.gif',
  'Folder.gif'
]

/**
 * Finds a cover image in a folder, by checkcking the existence of candidate files:
 * - cover.{ext}
 * - Cover.{ext}
 * - folder.{ext}
 * - Folder.{ext}
 *
 * possible extensions are: .jpeg, .jpg, .png, .gif (all lowercase)
 * @async
 * @param {string} path - folder path on drive
 * @returns {string} the first existing cover image path, or null
 */
export async function findInFolder(path) {
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
}

/**
 * Finds cover images for a given album:
 * - uses the containing folder of the album first track
 * - returns all images within it (jpeg/png/gif/bmp)
 * @async
 * @param {AlbumModel} album - album to search images for
 * @returns {array<Cover>} list (may be empty) of covers
 */
export async function findForAlbum(album) {
  const { path } = await tracksModel.getById(album.trackIds[0])
  return firstValueFrom(
    walk(dirname(path)).pipe(
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
      map(({ path }) => path),
      reduce(
        (results, path) => [...results, { cover: path, provider: 'Local' }],
        []
      )
    )
  )
}
