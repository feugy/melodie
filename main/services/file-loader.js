'use strict'
const { dialog } = require('electron')
const { read } = require('./tag-reader')

module.exports = {
  async load() {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections']
    })
    if (!filePaths) {
      return null
    }
    return Promise.all(
      filePaths.map(async path => {
        let tags = {}
        try {
          tags = await read(path)
        } catch {
          // ignore ID3 reading errors for now
        }
        return { path, tags }
      })
    )
  }
}
