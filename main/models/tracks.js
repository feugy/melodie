'use strict'

const Model = require('./abstract-model')

class TracksModel extends Model {
  constructor() {
    super('tracks', table => {
      table.integer('id').primary()
      table.string('path')
      table.string('media')
      table.json('tags')
      table.float('mtimeMs')
    })
    this.jsonColumns = ['tags']
    this.searchCol = 'title.value'
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
    const saved = data.map(this.makeSerializer())
    const cols = Object.keys(saved[0])
    return this.db.transaction(async trx => {
      const old = await trx(this.name)
        .select('id', 'tags')
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
      return old.map(this.makeDeserializer())
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
