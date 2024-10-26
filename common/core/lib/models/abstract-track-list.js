import { difference, uniq } from '../utils/index.js'
import Model from './abstract-model.js'

/**
 * @class AbstractTrackList
 * Base class for all models containing references to tracks: Albums, Artists, Playlists.
 * Computes references automatically, and ensures reference integrity.
 */
export default class AbstractTrackList extends Model {
  /**
   * Builds a tracklist model manager, that can handle records with references to tracks
   * @param {object} args                         - arguments, including:
   * @param {boolean} [args.mergeTrackIds = true]   - true to merge newly saved with existing tracks
   * @param {array<string>} [args.jsonColumns = []] - array of column names storing JSON content
   * @returns {AbstractTrackList} a model manager
   */
  constructor({ mergeTrackIds = true, jsonColumns = [], ...rest }) {
    super({ jsonColumns: [...jsonColumns, 'trackIds', 'refs'], ...rest })
    this.mergeTrackIds = mergeTrackIds
    this.serializeForUi = this.serializeForUi.bind(this)
  }

  /**
   * @typedef {object} TrackListSaveResult
   * @property {array<AbstractTrackList>} saved - list (possibly empty) of saved models
   * @property {array<number>} removedIds       - list (possibly empty) of removed model ids
   */

  /**
   * Saves given tracklist model to database.
   * It creates new record when needed, and updates existing ones (based on provided id).
   * Partial update is supported: incoming data is merged with previous.
   * Tracks can be added (in `trackIds`) and removed (in `removedTrackIds`).
   * Given `mergeTrackIds` property, incoming track will be merged with existing tracks (unicity is guaranted),
   * or will override them (duplicates are allowed).
   *
   * A model with no tracks will be automatically removed.
   *
   * References to other models are automatically computed, with computeRefs() method.
   * @async
   * @param {object|array<object>} data - single or array of saved (partial) models
   * @returns {TrackListSaveResult} saved models and removed model ids
   */
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
            mediaCount: 1,
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

  /**
   * Lists models without media, and that where not processed since a given date.
   * Models which `processedEpoch` is after the provided date will be ignored.
   * @async
   * @param {number} when - epoch before which models could be retrieved.
   * @returns {array<AbstractModel>} array of models
   */
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

  /**
   * Returns serialized model with attributes for UI:
   * - {string} media: path to the model's media file (includes the media count)
   * @param {AbstractTrackList} model - to be serialized
   * @returns {object} serialized model
   */
  serializeForUi(model) {
    return model
      ? {
          ...model,
          mediaCount: undefined,
          media: model.media
            ? `/${this.name}/${model.id}/media/${model.mediaCount}`
            : null
        }
      : model
  }
}
