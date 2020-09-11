'use strict'

const Model = require('./abstract-model')
const { hash } = require('../utils')

class TracksModel extends Model {
  constructor() {
    super({
      name: 'tracks',
      jsonColumns: ['tags', 'artistRefs', 'albumRef'],
      searchCol: 'title.value'
    })
  }

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

  enrichForSearch(query, searched) {
    return query
      .select(`${this.name}.*`)
      .joinRaw(`, json_each(tags, '$.title') as title`)
      .where('title.value', 'like', `%${searched.toLowerCase()}%`)
  }
}

exports.tracksModel = new TracksModel()
