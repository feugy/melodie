'use strict'

const got = require('got')
const { basename } = require('path')
const AbstractProvider = require('../abstract-provider')

class Discogs extends AbstractProvider {
  constructor() {
    super('Discogs', 25)
  }

  init({ token } = {}) {
    this.token = token || null
    this.prefixUrl = `https://api.discogs.com`
  }

  async findArtistArtwork(searched) {
    this.logger.debug({ searched }, `search artist artwork for ${searched}`)
    if (!this.token) {
      return []
    }
    this.checkRate(`Can not search artist artwork for ${searched}`)
    try {
      const { results } = await got('database/search', {
        prefixUrl: this.prefixUrl,
        headers: { 'user-agent': this.userAgent },
        searchParams: {
          token: this.token,
          type: 'artist',
          title: `"${searched.toLowerCase().trim()}"`,
          per_page: 3
        }
      }).json()
      this.logger.debug(
        { length: results.length, searched },
        `got results for ${searched}`
      )

      const requests = await Promise.allSettled(
        results.map(async ({ id, cover_image: image }) => {
          const { profile } = await got(`artists/${id}`, {
            prefixUrl: this.prefixUrl,
            headers: { 'user-agent': this.userAgent }
          }).json()

          const artwork =
            image && basename(image) !== 'spacer.gif' ? image : undefined
          const result = { provider: this.name }
          if (profile) {
            result.bio = { en: profile }
          }
          if (artwork) {
            result.artwork = artwork
          }
          return profile || artwork ? result : null
        })
      )
      return requests.reduce(
        (results, { value }) => (value ? [...results, value] : results),
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
    if (!this.token) {
      return []
    }
    this.checkRate(`Can not search album cover for ${searched}`)
    try {
      const { results } = await got(`database/search`, {
        prefixUrl: this.prefixUrl,
        headers: { 'user-agent': this.userAgent },
        searchParams: {
          token: this.token,
          type: 'release',
          release_title: `"${searched.toLowerCase().trim()}"`,
          per_page: 3
        }
      }).json()
      this.logger.debug(
        { length: results.length, searched },
        `got results for ${searched}`
      )

      return results.reduce((results, { cover_image: cover }) => {
        if (cover && basename(cover) !== 'spacer.gif') {
          results.push({ cover, provider: this.name })
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
