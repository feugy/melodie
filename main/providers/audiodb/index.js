'use strict'

const got = require('got')
const AbstractProvider = require('../abstract-provider')

class AudioDB extends AbstractProvider {
  constructor() {
    super('AudioDB', 25)
  }

  init({ key } = {}) {
    this.key = key || 1
    this.prefixUrl = `https://www.theaudiodb.com/api/v1/json/${this.key}`
  }

  async findArtistArtwork(searched) {
    this.logger.debug({ searched }, `search artist artwork for ${searched}`)
    this.checkRate(`Can not search artist artwork for ${searched}`)
    try {
      const { artists } = await got(`search.php`, {
        prefixUrl: this.prefixUrl,
        headers: { 'user-agent': this.userAgent },
        searchParams: { s: searched.toLowerCase().trim() }
      }).json()
      this.logger.debug(
        { length: artists ? artists.length : 0, searched },
        `got results for ${searched}`
      )

      return (artists || []).reduce(
        (results, { strArtistThumb, strArtistFanart }) => {
          if (strArtistThumb) {
            results.push({
              full: strArtistThumb,
              provider: this.name
            })
          }
          if (strArtistFanart) {
            results.push({
              full: strArtistFanart,
              provider: this.name
            })
          }
          return results
        },
        []
      )
    } catch (err) {
      this.logger.error(
        { err, searched },
        `failed to search artist artwork: ${err.message}`
      )
      return []
    }
  }

  async findAlbumCover(searched) {
    this.logger.debug({ searched }, `search album cover for ${searched}`)
    this.checkRate(`Can not search album cover for ${searched}`)
    try {
      const { album } = await got(`searchalbum.php`, {
        prefixUrl: this.prefixUrl,
        headers: { 'user-agent': this.userAgent },
        searchParams: { a: searched.toLowerCase().trim() }
      }).json()
      this.logger.debug(
        { length: album ? album.length : 0, searched },
        `got results for ${searched}`
      )

      return (album || []).reduce((results, { strAlbumThumb: full }) => {
        if (full) {
          results.push({
            full,
            provider: this.name
          })
        }
        return results
      }, [])
    } catch (err) {
      this.logger.error(
        { err, searched },
        `failed to search album cover: ${err.message}`
      )
      return []
    }
  }
}

module.exports = new AudioDB()
