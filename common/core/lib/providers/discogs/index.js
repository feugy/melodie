import got from 'got'
import { basename } from 'path'

import AbstractProvider from '../abstract-provider.js'

/**
 * @class Discogs
 * Searches on Discogs for:
 * - artworks
 * - bios
 * - covers
 * Requires an access token: a developer account at Discogs is needed, then generate a personal access token.
 * @see https://www.discogs.com/settings/developers
 */
class Discogs extends AbstractProvider {
  constructor() {
    super('Discogs', 25)
  }

  /**
   * Initialization function, to configure the token used.
   */
  init({ token } = {}) {
    this.token = token || null
    this.prefixUrl = `https://api.discogs.com`
  }

  /**
   * Finds artwork and bios for a given artist.
   * Searches by artist name, looking for 3 results at most, then retrieving their cover_image and profile.
   * @async
   * @param {string} searched - artist's name
   * @returns {array<Artwork>} list (may be empty) of artworks
   * @see https://www.discogs.com/developers/#page:database,header:database-search
   * @see https://www.discogs.com/developers/#page:database,header:database-artist
   */
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

  /**
   * Finds covers for a given album.
   * Searches by release name, looking for 3 results at most, then retrieving their cover_image.
   * @async
   * @param {string} searched - album's name
   * @returns {array<Cover>} list (may be empty) of covers
   * @see https://www.discogs.com/developers/#page:database,header:database-search
   */
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

const discogs = new Discogs()
export default discogs
