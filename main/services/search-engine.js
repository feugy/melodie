'use strict'

const FlexSearch = require('flexsearch')
const { app } = require('electron')
const fs = require('fs')
const { join } = require('path')

const appPath = app.getAppPath('userData')
let tracksIndex

async function exportIndex(index) {
  await fs.promises.writeFile(
    join(appPath, `${index.name}.index`),
    index.export({ serialized: false })
  )
}

async function importIndex(index) {
  const file = join(appPath, `${index.name}.index`)
  try {
    await fs.promises.access(file, fs.constants.R_OK)
    index.import(await fs.promises.readFile(file), {
      serialized: false
    })
  } catch {
    // ignore missing file for now
  }
}

module.exports = {
  async init() {
    tracksIndex = new FlexSearch({
      doc: {
        // TODO hash path
        id: 'path',
        field: [
          'tags:artists',
          'tags:albumartist',
          'tags:title',
          'tags:album',
          'tags:year'
        ]
      }
    })
    tracksIndex.name = 'tracks'
    await importIndex(tracksIndex)
  },

  async add(tracks) {
    if (!tracksIndex) {
      throw new Error('search engine not initialized')
    }
    tracksIndex.add(tracks)
    const albums = new Set()
    for (const track of tracks) {
      albums.add(track.tags.album)
    }
    // TODO defer
    await exportIndex(tracksIndex)
  },

  async searchBy(field, term) {
    if (!tracksIndex) {
      throw new Error('search engine not initialized')
    }
    return tracksIndex.where({
      [field]: term
    })
  }
}
