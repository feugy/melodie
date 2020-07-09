'use strict'

const { dialog } = require('electron')
const pMap = require('p-map')
const { hash } = require('../utils')
const { read } = require('./tag-reader')
const { findFor } = require('./cover-finder')
const { add: addTracks } = require('./search-engine')
const { add: addAlbums } = require('./list-engine')

const concurrency = 10

module.exports = {
  async load() {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections']
    })
    if (!filePaths || filePaths.length === 0) {
      return null
    }
    const tracks = await pMap(
      filePaths,
      async path => {
        const tags = await read(path)
        return { id: hash(path), path, tags, cover: await findFor(path) }
      },
      { concurrency }
    )
    await addTracks(tracks)
    await addAlbums(tracks)
    return tracks
  }
}
