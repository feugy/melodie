'use strict'

const got = require('got')
const { basename } = require('path')
const AbstractProvider = require('../abstract-provider')

class Discogs extends AbstractProvider {
  constructor() {
    super('Discogs', 25)
    this.key = process.env.DISCOGS_KEY || 'KEY'
    this.secret = process.env.DISCOGS_SECRET || 'SECRET'
    this.prefixUrl = `https://api.discogs.com`
  }

  async findArtistArtwork(searched) {
    this.logger.debug({ searched }, `search artist artwork for ${searched}`)
    this.checkRate(`Can not search artist artwork for ${searched}`)
    try {
      const { results } = await got('database/search', {
        prefixUrl: this.prefixUrl,
        headers: { 'user-agent': this.userAgent },
        searchParams: {
          key: this.key,
          secret: this.secret,
          type: 'artist',
          title: `"${searched.toLowerCase().trim()}"`,
          per_page: 3
        }
      }).json()
      this.logger.debug(
        { length: results.length, searched },
        `got results for ${searched}`
      )

      return results.reduce((results, { cover_image: full }) => {
        if (full && basename(full) !== 'spacer.gif') {
          results.push({ full, provider: this.name })
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

  async findAlbumCover(searched) {
    this.logger.debug({ searched }, `search album cover for ${searched}`)
    this.checkRate(`Can not search album cover for ${searched}`)
    try {
      const { results } = await got(`database/search`, {
        prefixUrl: this.prefixUrl,
        headers: { 'user-agent': this.userAgent },
        searchParams: {
          key: this.key,
          secret: this.secret,
          type: 'release',
          release_title: `"${searched.toLowerCase().trim()}"`,
          per_page: 3
        }
      }).json()
      this.logger.debug(
        { length: results.length, searched },
        `got results for ${searched}`
      )

      return results.reduce((results, { cover_image: full }) => {
        if (full && basename(full) !== 'spacer.gif') {
          results.push({ full, provider: this.name })
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

module.exports = new Discogs()
