'use strict'

const got = require('got')
const AbstractProvider = require('../abstract-provider')
const descByLocales = {
  en: 'strBiographyEN',
  fr: 'strBiographyFR'
}

/**
 * @class AudioDB
 * Searches on AudioDB for:
 * - artworks
 * - bios
 * - covers
 * Requires a key, only delivered to patreons.
 * @see https://www.theaudiodb.com/api_apply.php
 */
class AudioDB extends AbstractProvider {
  constructor() {
    super('AudioDB', 25)
  }

  /**
   * Initialization function, to configure the key used.
   */
  init({ key } = {}) {
    this.key = key || null
    this.prefixUrl = `https://www.theaudiodb.com/api/v1/json/${this.key}`
  }

  /**
   * Finds artwork and bios for a given artist.
   * Searches by artist name, retrieving their strArtistThumb, strArtistFanart and strBiographyXY.
   * @async
   * @param {string} searched - artist's name
   * @returns {array<Artwork>} list (may be empty) of artworks
   * @see https://www.theaudiodb.com/api_guide.php
   */
  async findArtistArtwork(searched) {
    this.logger.debug({ searched }, `search artist artwork for ${searched}`)
    if (!this.key) {
      return []
    }
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

      return (artists || []).reduce((results, data) => {
        const result = { bio: {}, provider: this.name }
        let hasBio = false
        for (const locale in descByLocales) {
          const description = data[descByLocales[locale]]
          if (description) {
            hasBio = true
            result.bio[locale] = description
          }
        }
        if (data.strArtistThumb) {
          results.push({ ...result, artwork: data.strArtistThumb })
        }
        if (data.strArtistFanart) {
          results.push({ ...result, artwork: data.strArtistFanart })
        }
        if (!data.strArtistThumb && !data.strArtistFanart && hasBio) {
          results.push(result)
        }
        return results
      }, [])
    } catch (err) {
      this.logger.error(
        { err, searched },
        `failed to search artist artwork: ${err.message}`
      )
      return []
    }
  }

  /**
   * Finds covers for a given album.
   * Searches by album name, retrieving their strAlbumThumb.
   * @async
   * @param {string} searched - album's name
   * @returns {array<Cover>} list (may be empty) of covers
   * @see https://www.theaudiodb.com/api_guide.php
   */
  async findAlbumCover(searched) {
    this.logger.debug({ searched }, `search album cover for ${searched}`)
    if (!this.key) {
      return []
    }
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

      return (album || []).reduce((results, { strAlbumThumb: cover }) => {
        if (cover) {
          results.push({
            cover,
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
