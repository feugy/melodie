'use strict'

const Model = require('./abstract-model')
const { uniq, difference } = require('../utils')

module.exports = class AbstractTrackList extends Model {
  constructor({ mergeTrackIds = true, jsonColumns = [], ...rest }) {
    super({ jsonColumns: [...jsonColumns, 'trackIds', 'refs'], ...rest })
    this.mergeTrackIds = mergeTrackIds
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
            processedEpoch: null,
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
        const cols = Object.keys(saved[0])
        this.logger.debug({ data: saved, cols }, `saving`)
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

  async listMedialess(when) {
    const results = (
      await this.db
        .select()
        .from(this.name)
        .whereNull('media')
        .andWhere(function () {
          this.where('processedEpoch', '<=', when).orWhereNull('processedEpoch')
        })
        .orderBy('name', 'asc')
    ).map(this.makeDeserializer())
    this.logger.debug(
      { hitCount: results.length, when },
      `list medialess since ${new Date(when).toISOString()}`
    )
    return results
  }
}
