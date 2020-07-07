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
const collator = new Intl.Collator({ numeric: true })

module.exports = {
  async init() {
    albumIds = await importIndex(albumsStore, 'albums')
  },

  async add(tracks) {
    if (!albumsStore) {
      throw new Error('list engine not initialized')
    }
    const albums = new Set()
    for (const track of tracks) {
      albums.add(track.tags.album)
    }
    for (const title of albums) {
      const id = hash(title)
      if (!albumIds.has(id)) {
        albumsStore.push({ id, title })
        albumIds.add(id)
      }
    }
    albumsStore.sort((a, b) => collator.compare(a.title, b.title))

    // TODO defer
    await exportIndex(albumsStore, 'albums')
  },

  async listAlbums() {
    if (!albumsStore) {
      throw new Error('list engine not initialized')
    }
    return albumsStore
  }
}
