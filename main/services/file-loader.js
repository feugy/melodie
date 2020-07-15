'use strict'

const { dialog } = require('electron')
const pMap = require('p-map')
const klaw = require('klaw')
const { extname } = require('path')
const { hash } = require('../utils')
const tag = require('./tag-reader')
const covers = require('./cover-finder')
const lists = require('./list-engine')

const readConcurrency = 10
const walkConcurrency = 2
const saveThreshold = 50 // more may cause too many SQL variables :\
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
  async chooseFolders() {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory', 'multiSelections']
    })
    return filePaths
  },

  async crawl(folders) {
    if (!folders || folders.length === 0) {
      return null
    }
    const files = []
    await pMap(folders, walk(files), { concurrency: walkConcurrency })
    const saved = []
    const tracks = await pMap(
      files,
      async path => {
        const tags = await tag.read(path)
        const track = {
          id: hash(path),
          path,
          tags,
          media: await covers.findFor(path)
        }
        saved.push(track)
        if (saved.length === saveThreshold) {
          let tmp = saved.concat()
          saved.splice(0, saved.length)
          await lists.add(tmp)
          tmp = undefined
        }
        return track
      },
      { concurrency: readConcurrency }
    )
    await lists.add(saved)
    return tracks
  }
}
