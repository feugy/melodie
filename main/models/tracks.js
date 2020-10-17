'use strict'

const Model = require('./abstract-model')
const { hash } = require('../utils')

/**
 * @class TracksModel
 * Manager for Tracks model. The seached column is tags.title.
 * Has references to artists and albums.
 */
class TracksModel extends Model {
  constructor() {
    super({
      name: 'tracks',
      jsonColumns: ['tags', 'artistRefs', 'albumRef'],
      searchCol: 'title.value'
    })
  }

  /**
   * Lists model ids and modification time, for comparison purposes, without pagination.
   * @async
   * @returns {array<object>} array of objects with `id` and `mtimeMs` properties
   */
  async listWithTime() {
    const result = new Map()
    for (const { id, mtimeMs } of await this.db(this.name).select(
      'id',
      'mtimeMs'
    )) {
      result.set(id, mtimeMs)
    }
    this.logger.debug({ hitCount: result.size }, 'list with time')
    return result
  }

  /**
   * Returns models by their paths.
   * It uses like operator so we can list tracks by their containing folder.
   * @async
   * @param {array<string>} paths - searched paths
   * @returns {array<TracksModel>} a list (possibly empty) of matching tracks
   */
  async getByPaths(paths) {
    const query = this.db(this.name)
    for (const path of paths) {
      query.orWhere('path', 'like', `${path}%`)
    }
    const results = (await query.select()).map(this.makeDeserializer())
    this.logger.debug({ paths, hitCount: results.length }, `fetch by paths`)
    return results
  }

  /**
   * @typedef {object} TrackSaveResult
   * @property {TracksModel} current  - current saved values
   * @property {TracksModel} previous - previous values
   */

  /**
   * Saves given track model to database.
   * It creates new record when needed, and updates existing ones (based on provided id).
   * Partial update is supported: incoming data is merged with previous.
   * Returns previous and current state for each model, to allow spotting changes in tags.
   * @async
   * @param {object|array<object>} data - single or array of saved (partial) tracks
   * @returns {array<TrackSaveResult>} saved models with their current and previous state
   */
  async save(data) {
    if (!Array.isArray(data)) {
      data = [data]
    }
    this.logger.debug({ data }, `saving`)
    const serialize = this.makeSerializer()
    const deserialize = this.makeDeserializer()
    const saved = data.map(track => {
      const { album, albumartist, artists } = track.tags
      return serialize({
        ...track,
        albumRef: album
          ? [hash(albumartist ? `${album} --- ${albumartist}` : album), album]
          : [1, null],
        artistRefs:
          artists && artists.length
            ? artists.map(artist => [hash(artist), artist])
            : [[1, null]]
      })
    })
    const cols = Object.keys(saved[0])
    return this.db.transaction(async trx => {
      const old = await trx(this.name)
        .select('id', 'artistRefs', 'albumRef', 'tags')
        .whereIn(
          'id',
          saved.map(({ id }) => id)
        )
      await trx.raw(
        `? on conflict (\`id\`) do update set ${cols
          .map(col => `\`${col}\` = excluded.\`${col}\``)
          .join(', ')}`,
        [trx(this.name).insert(saved)]
      )
      return saved.map(data => {
        const previous = old.find(({ id }) => id === data.id)
        return {
          current: deserialize(data),
          previous: previous ? deserialize(previous) : null
        }
      })
    })
  }

  /**
   * Implementes search with tags' titles
   * @protected
   * @param {QueryBuilder} query - Knex query builder to customize
   * @param {string} searched - searched text
   * @returns {QueryBuilder} customized Knex query builder
   */
  enrichForSearch(query, searched) {
    return query
      .select(`${this.name}.*`)
      .joinRaw(`, json_each(tags, '$.title') as title`)
      .where('title.value', 'like', `%${searched.toLowerCase()}%`)
  }
}

exports.tracksModel = new TracksModel()
