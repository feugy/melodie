'use strict'

const { shell } = require('electron')
const { services } = require('@melodie/core')

module.exports = {
  ...services.tracks,

  /**
   * Opens the folder containing a given track
   * @param {TracksModel} track - the opened track
   */
  openContainingFolder(track) {
    shell.showItemInFolder(track.path)
  }
}
