'use strict'

const { dialog } = require('electron')
const pMap = require('p-map')
const klaw = require('klaw')
const { extname } = require('path')
const { hash } = require('../utils')
const tag = require('./tag-reader')
const covers = require('./cover-finder')
const search = require('./search-engine')
const lists = require('./list-engine')

const readConcurrency = 10
const walkConcurrency = 2
const supported = ['.mp3', '.ogg', '.flac']

const walk = items =>
  async function (path) {
    return new Promise(function (resolve) {
      klaw(path)
        .on('readable', function () {
          let item
          while ((item = this.read())) {
            if (
              item.stats.isFile() &&
              supported.includes(extname(item.path).toLowerCase())
            ) {
              items.push(item.path)
            }
          }
        })
        .on('end', resolve)
    })
  }

module.exports = {
  async load() {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory', 'multiSelections']
    })
    if (!filePaths || filePaths.length === 0) {
      return null
    }
    const files = []
    await pMap(filePaths, walk(files), { concurrency: walkConcurrency })
    const tracks = await pMap(
      files,
      async path => {
        const tags = await tag.read(path)
        return { id: hash(path), path, tags, cover: await covers.findFor(path) }
      },
      { concurrency: readConcurrency }
    )
    await search.add(tracks)
    await lists.add(tracks)
    return tracks
  }
}
