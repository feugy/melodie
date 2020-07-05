'use strict'
const { parseFile } = require('music-metadata')

module.exports = {
  async read(path) {
    return (await parseFile(path)).common
  }
}
