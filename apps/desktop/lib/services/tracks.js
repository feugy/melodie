'use strict'

const { shell } = require('electron')
const { services, models } = require('@melodie/core')

module.exports = {
  ...services.tracks,

  /**
   * Opens the folder containing a given track
   * @param {String} track id - the opened track id
   */
  async openContainingFolder(trackId) {
    const model = await models.tracksModel.getById(trackId)
    if (model) {
      shell.showItemInFolder(
        encodeURIComponent(model.path).replace(/%2F/g, '/')
      )
    }
  }
}
