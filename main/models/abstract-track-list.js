'use strict'

const Model = require('./abstract-model')
const { uniq, difference } = require('../utils')

module.exports = class AbstractTrackList extends Model {
  constructor(name, definition) {
    super(name, table => {
      definition(table)
      table.json('trackIds')
      table.json('linked')
    })
    this.jsonColumns.push('trackIds', 'linked')
  }

  async save(data) {
    if (!Array.isArray(data)) {
      data = [data]
    }
    const serialize = this.makeSerializer()

    return this.db.transaction(async trx => {
      const previous = (
        await trx(this.name)
          .select()
          .whereIn(
            'id',
            data.map(({ id }) => id)
          )
      ).map(this.makeDeserializer())

      const { saved, removedIds } = data.reduce(
        ({ saved, removedIds }, trackList) => {
          const previousList = previous.find(
            ({ id }) => id === trackList.id
          ) || {
            media: null,
            trackIds: [],
            linked: []
          }
          const savedList = {
            ...previousList,
            trackIds: uniq(
              difference(
                previousList.trackIds.concat(trackList.trackIds || []),
                trackList.removedTrackIds || []
              )
            ),
            linked: uniq(
              difference(
                previousList.linked.concat(trackList.linked || []),
                trackList.removedLinked || []
              )
            )
          }
          if (savedList.trackIds.length) {
            // one can not update with sparse data: we have to get previous columns
            for (const col of Object.keys(trackList)) {
              if (
                col !== 'trackIds' &&
                col !== 'removedTrackIds' &&
                col !== 'linked' &&
                col !== 'removedLinked' &&
                trackList[col] !== undefined
              ) {
                savedList[col] = trackList[col]
              }
            }
            saved.push(savedList)
          } else {
            removedIds.push(trackList.id)
          }
          return { saved, removedIds }
        },
        { saved: [], removedIds: [] }
      )

      if (saved.length) {
        this.logger.debug({ data: saved }, `saving`)
        const cols = Object.keys(saved[0])
        await trx.raw(
          `? on conflict (\`id\`) do update set ${cols
            .map(col => `\`${col}\` = excluded.\`${col}\``)
            .join(', ')}`,
          [trx(this.name).insert(saved.map(serialize))]
        )
      }
      if (removedIds.length) {
        this.logger.debug({ ids: removedIds }, `removing`)
        await trx(this.name).whereIn('id', removedIds).delete()
      }
      return { saved, removedIds }
    })
  }
}
