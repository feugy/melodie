'use strict'

const got = require('got')
const { getLogger } = require('../utils')

const providers = [
  {
    name: 'AudioDB',

    key: '1', // TODO use real key instead

    logger: getLogger('services/artwork/audiodb'),

    async findForArtist(name) {
      const url = `https://www.theaudiodb.com/api/v1/json/${
        this.key
      }/search.php?s=${encodeURIComponent(name.toLowerCase().trim())}`
      this.logger.debug({ url, name }, `search for ${name} on ${this.name}`)

      const { artists } = await got(url).json()
      this.logger.debug(
        { length: artists.length, name },
        `got results for ${name}`
      )

      return artists.reduce((results, { strArtistThumb, strArtistFanart }) => {
        if (strArtistThumb) {
          results.push({
            full: strArtistThumb,
            preview: `${strArtistThumb}/preview`
          })
        }
        if (strArtistFanart) {
          results.push({
            full: strArtistFanart,
            preview: `${strArtistFanart}/preview`
          })
        }
        return results
      }, [])
    }
  }
]

module.exports = {
  async findForArtist(name) {
    const requests = await Promise.all(
      providers.map(provider =>
        provider.findForArtist(name).catch(err => {
          provider.logger.error(
            { err, name },
            `failed to search ${name}: ${err.message}`
          )
          return []
        })
      )
    )
    return requests.reduce((results, value) => [...results, ...value])
  }
}
