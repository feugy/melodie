'use strict'

const exported = {
  ...require('./albums'),
  ...require('./artists'),
  ...require('./playlists'),
  ...require('./settings'),
  ...require('./tracks')
}

exported.init = async function (...args) {
  await exported.settingsModel.init(...args)
  await exported.albumsModel.init(...args)
  await exported.artistsModel.init(...args)
  await exported.tracksModel.init(...args)
  await exported.playlistsModel.init(...args)
}

module.exports = exported
