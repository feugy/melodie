'use strict'

const Model = require('./abstract-model')
const { uniq, difference } = require('../utils')

module.exports = class AbstractTrackList extends Model {
  constructor(name, definition, mergeTrackIds = true) {
    super(name, table => {
      definition(table)
      table.json('trackIds')
      table.json('refs')
    })
    this.mergeTrackIds = mergeTrackIds
    this.jsonColumns.push('trackIds', 'refs')
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
            refs: []
          }
          const savedList = {
            ...previousList,
            trackIds: this.mergeTrackIds
              ? uniq(
                  difference(
                    previousList.trackIds.concat(trackList.trackIds || []),
                    trackList.removedTrackIds || []
                  )
                )
              : trackList.trackIds || []
          }
          if (savedList.trackIds.length) {
            // one can not update with sparse data: we have to get previous columns
            for (const col of Object.keys(trackList)) {
              if (
                col !== 'trackIds' &&
                col !== 'removedTrackIds' &&
                col !== 'refs' &&
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
        for (const data of saved) {
          data.refs = await this.computeRefs(trx, data.trackIds)
        }
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
