'use strict'

const { playlistsModel } = require('../models')
const { getLogger, broadcast, hash } = require('../utils')

const logger = getLogger('services/playlists')

function pickData({ id, name, media, desc, trackIds }) {
  // whitelist saved data
  return { id, name, media, desc, trackIds }
}

module.exports = {
  async save(playlist) {
    logger.debug({ playlist }, `save playlist`)
    if (!playlist.id) {
      playlist.id = hash(Date.now().toString())
    }
    const {
      saved: [saved],
      removedIds
    } = await playlistsModel.save(pickData(playlist))
    if (removedIds.length) {
      broadcast(`playlist-removals`, [removedIds[0]])
    } else {
      broadcast(`playlist-changes`, [saved])
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
    broadcast(`playlist-changes`, [saved])
    return saved
  }
}
