'use strict'

const TrackList = require('./abstract-track-list')
const { tracksModel } = require('./tracks')
const { uniqRef, parseRawRefArray } = require('../utils')

class AlbumsModel extends TrackList {
  constructor() {
    super({ name: 'albums', searchCol: 'name' })
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

  async computeRefs(trx, trackIds) {
    const refs = await trx(tracksModel.name)
      .whereIn('id', trackIds)
      .select('artistRefs')
    return uniqRef(
      refs.reduce(
        (all, { artistRefs }) => all.concat(parseRawRefArray(artistRefs)),
        []
      )
    )
  }
}

exports.albumsModel = new AlbumsModel()
