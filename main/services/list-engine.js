'use strict'
const { app } = require('electron')
const fs = require('fs')
const { join } = require('path')

const appPath = app.getAppPath('userData')

async function exportIndex(index, name) {
  await fs.promises.writeFile(
    join(appPath, `${name}.index`),
    JSON.stringify(index)
  )
}

async function importIndex(index, name) {
  const file = join(appPath, `${name}.index`)
  try {
    await fs.promises.access(file, fs.constants.R_OK)
    index.splice(
      0,
      index.length,
      ...JSON.parse(await fs.promises.readFile(file))
    )
  } catch {
    // ignore missing file for now
  }
}

let albumsStore = []
const collator = new Intl.Collator({ numeric: true })

module.exports = {
  async init() {
    await importIndex(albumsStore, 'albums')
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
      albumsStore.push({ title })
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
