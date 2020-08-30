'use strict'

const { playlistsModel } = require('../models')
const { getLogger, broadcast, hash } = require('../utils')

const logger = getLogger('services/playlist')

module.exports = {
  async save(playlist) {
    logger.debug({ playlist }, `save playlist`)
    if (!playlist.id) {
      playlist.id = hash(Date.now().toString())
    }
    const {
      saved: [saved],
      removedIds
    } = await playlistsModel.save(playlist)
    if (removedIds.length) {
      broadcast(`playlist-removal`, removedIds[0])
    } else {
      broadcast(`playlist-change`, saved)
    }
    return saved
  },

  async append(id, trackIds) {
    const playlist = await playlistsModel.getById(id)
    if (!playlist) {
      logger.debug({ id, trackIds }, `attempt to add to an unknown playlist`)
      return null
    }
    logger.debug({ playlist, trackIds }, `append to playlist`)
    const {
      saved: [saved]
    } = await playlistsModel.save({
      ...playlist,
      trackIds: [
        ...playlist.trackIds,
        ...(Array.isArray(trackIds) ? trackIds : [trackIds])
      ]
    })
    broadcast(`playlist-change`, saved)
    return saved
  }
}
