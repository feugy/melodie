'use strict'

const audiodb = require('./audiodb')
const discogs = require('./discogs')
const local = require('./local')

module.exports = {
  audiodb,
  discogs,
  local,
  allProviders: [audiodb, discogs, local],
  TooManyRequestsError: require('./too-many-requests-error')
}
