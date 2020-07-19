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
  }

  async save(data) {
    if (!Array.isArray(data)) {
      data = [data]
    }
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
}

exports.tracksModel = new TracksModel()
