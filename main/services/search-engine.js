'use strict'

const FlexSearch = require('flexsearch/flexsearch')
const fs = require('fs-extra')
const { getIndexPath } = require('../utils')

async function exportIndex(index) {
  const file = getIndexPath(index.name)
  await fs.ensureFile(file)
  await fs.writeFile(file, index.export({ serialized: false }))
}

async function importIndex(index) {
  const file = getIndexPath(index.name)
  try {
    await fs.access(file, fs.constants.R_OK)
    index.import(await fs.readFile(file), {
      serialized: false
    })
  } catch {
    // ignore missing file for now
  }
}

const tracksIndex = new FlexSearch()
tracksIndex.name = 'tracks'

module.exports = {
  async init() {
    tracksIndex.init({
      doc: {
        id: 'id',
        field: {
          artists: {},
          title: {},
          album: {},
          year: { encode: false, tokenize: 'strict' }
        },
        store: ['id', 'tags', 'cover', 'path']
      }
    })
    await importIndex(tracksIndex)
  },

  async reset() {
    tracksIndex.clear()
    await exportIndex(tracksIndex)
    await module.exports.init()
  },

  async add(tracks) {
    for (const track of tracks) {
      tracksIndex.add({
        ...track,
        artists: track.tags.artists.join(' '),
        title: track.tags.title,
        year: `${track.tags.year}`,
        album: track.tags.album
      })
    }
    // TODO defer
    await exportIndex(tracksIndex)
  },

  async searchBy(field, term) {
    return tracksIndex.where({
      [field]: term
    })
  }
}
