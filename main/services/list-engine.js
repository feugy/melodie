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

module.exports = {
  async init() {
    albumIds = await importIndex(albumsStore, 'albums')
    artistIds = await importIndex(artistsStore, 'artists')
  },

  async add(tracks) {
    if (!albumsStore) {
      throw new Error('list engine not initialized')
    }
    const albums = new Set()
    const artists = new Set()
    for (const track of tracks) {
      albums.add(track.tags.album)
      for (const artist of track.tags.artists) {
        artists.add(artist)
      }
    }
    const albumsSize = albumIds.size
    for (const title of albums) {
      const id = hash(title)
      if (!albumIds.has(id)) {
        albumsStore.push({ id, title })
        albumIds.add(id)
      }
    }
    if (albumIds.size != albumsSize) {
      albumsStore.sort((a, b) => collator.compare(a.title, b.title))
    }
    const artistsSize = artistIds.size
    for (const name of artists) {
      const id = hash(name)
      if (!artistIds.has(id)) {
        artistsStore.push({ id, name })
        artistIds.add(id)
      }
    }
    if (artistIds.size != artistsSize) {
      artistsStore.sort((a, b) => collator.compare(a.title, b.title))
    }

    // TODO defer
    await exportIndex(albumsStore, 'albums')
    await exportIndex(artistsStore, 'artists')
  },

  async listAlbums() {
    if (!albumsStore) {
      throw new Error('list engine not initialized')
    }
    return albumsStore
  },

  async listArtists() {
    if (!albumsStore) {
      throw new Error('list engine not initialized')
    }
    return artistsStore
  }
}
