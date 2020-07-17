'use strict'

const { difference } = require('lodash')
const Model = require('./abstract-model')

module.exports = class AbstractTrackList extends Model {
  constructor(name, definition) {
    super(name, table => {
      definition(table)
      table.json('trackIds')
    })
    this.jsonColumns.push('trackIds')
  }

  async save(data) {
    if (!Array.isArray(data)) {
      data = [data]
    }
    const serialize = this.makeSerializer()

    return this.db.transaction(async trx => {
      const old = await trx(this.name)
        .select('id', 'trackIds')
        .whereIn(
          'id',
          data.map(({ id }) => id)
        )
      const saved = data.map(trackList => {
        const oldTrackList = old.find(({ id }) => id === trackList.id)
        let trackIds = trackList.trackIds
        if (oldTrackList) {
          trackIds = difference(
            JSON.parse(oldTrackList.trackIds).concat(trackList.trackIds),
            trackList.removedTrackIds
          )
        }
        const saved = { ...trackList, trackIds }
        delete saved.removedTrackIds
        return serialize(saved)
      })

      const cols = Object.keys(saved[0])
      await trx.raw(
        `? on conflict (\`id\`) do update set ${cols
          .map(col => `\`${col}\` = excluded.\`${col}\``)
          .join(', ')}`,
        [trx(this.name).insert(saved)]
      )
      return old
    })
  }
}
