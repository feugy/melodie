'use strict'

const TrackList = require('./abstract-track-list')

class AlbumsModel extends TrackList {
  constructor() {
    super('albums', table => {
      table.integer('id').primary()
      table.string('name')
      table.string('media')
    })
    this.searchCol = 'name'
  }

  async getByName(name) {
    const results = (
      await this.db
        .whereRaw('name = ? collate nocase', name)
        .select()
        .from(this.name)
    ).map(this.makeDeserializer())
    this.logger.debug({ name, hitCount: results.length }, 'fetch by name')
    return results
  }
}

exports.albumsModel = new AlbumsModel()
