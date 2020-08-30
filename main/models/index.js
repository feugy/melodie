'use strict'

module.exports = {
  ...require('./albums'),
  ...require('./artists'),
  ...require('./playlists'),
  ...require('./settings'),
  ...require('./tracks')
}
