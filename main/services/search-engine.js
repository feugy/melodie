'use strict'

const FlexSearch = require('flexsearch')
const fs = require('fs-extra')
const { getIndexPath } = require('../utils')

let tracksIndex

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

module.exports = {
  async init() {
    tracksIndex = new FlexSearch({
      doc: {
        id: 'id',
        field: {
          artists: {},
          title: {},
          album: {},
          year: { encode: false, tokenize: 'strict' }
        },
        store: ['id', 'tags']
      }
    })
    tracksIndex.name = 'tracks'
    await importIndex(tracksIndex)
  },

  async add(tracks) {
    if (!tracksIndex) {
      throw new Error('search engine not initialized')
    }
    for (const track of tracks) {
      tracksIndex.add({
        ...track,
        artists: (track.tags.artists || []).join(' '),
        title: track.tags.title,
        year: `${track.tags.year}`,
        album: track.tags.album
      })
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
