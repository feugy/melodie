'use strict'

const fs = require('fs-extra')
const { hash, getIndexPath } = require('../utils')

async function exportIndex(index, name) {
  const file = getIndexPath(name)
  await fs.ensureFile(file)
  await fs.writeFile(file, JSON.stringify(index))
}

async function importIndex(index, name) {
  const file = getIndexPath(name)
  const ids = new Set()
  try {
    await fs.access(file, fs.constants.R_OK)
    index.splice(0, index.length)
    for (const data of JSON.parse(await fs.readFile(file))) {
      index.push(data)
      ids.add(data.id)
    }
  } catch {
    // ignore missing file for now
  }
  return ids
}

let albumsStore = []
let albumIds = new Set()

let artistsStore = []
let artistIds = new Set()

const collator = new Intl.Collator({ numeric: true })

function addToIndex(ids, index, added) {
  const currentSize = ids.size
  for (const [, data] of added) {
    if (!ids.has(data.id)) {
      index.push(data)
      ids.add(data.id)
    }
  }
  if (ids.size != currentSize) {
    index.sort((a, b) => collator.compare(a.name, b.name))
  }
}

module.exports = {
  async init() {
    albumIds = await importIndex(albumsStore, 'albums')
    artistIds = await importIndex(artistsStore, 'artists')
  },

  async reset() {
    await exportIndex([], 'albums')
    await exportIndex([], 'artists')
    await module.exports.init()
  },

  async add(tracks) {
    const uniqueAlbums = new Map()
    const uniqueArtists = new Map()
    for (const track of tracks) {
      const { album, artists } = track.tags
      if (album) {
        const id = hash(album)
        if (!uniqueAlbums.has(id)) {
          uniqueAlbums.set(id, { id, name: album, image: track.cover })
        }
      }
      for (const artist of artists || []) {
        const id = hash(artist)
        if (!uniqueArtists.has(id)) {
          uniqueArtists.set(id, { id, name: artist })
        }
      }
    }

    addToIndex(albumIds, albumsStore, uniqueAlbums)
    addToIndex(artistIds, artistsStore, uniqueArtists)

    // TODO defer
    await exportIndex(albumsStore, 'albums')
    await exportIndex(artistsStore, 'artists')
  },

  async listAlbums() {
    return albumsStore
  },

  async listArtists() {
    return artistsStore
  }
}
