'use strict'

const fs = require('fs-extra')
const { join, extname, dirname } = require('path')

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
  async findFor(path) {
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
}
