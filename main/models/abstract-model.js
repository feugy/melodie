'use strict'

const knex = require('knex')
const fs = require('fs-extra')
const { getLogger } = require('../utils')

let db

async function connect(filename) {
  if (!db) {
    await fs.ensureFile(filename)
    db = knex({
      client: 'sqlite3',
      useNullAsDefault: true,
      connection: { filename }
    })
  }
  return db
}

module.exports = class AbstractModel {
  static async release() {
    if (db) {
      await db.context.destroy()
      db = null
    }
  }

  constructor(name, definition) {
    if (!name) {
      throw new Error(`every model needs a name`)
    }
    if (typeof definition !== 'function') {
      throw new Error(
        `${name} model needs a table definition, as for knex.createTable()`
      )
    }
    this.name = name
    this.definition = definition
    this.searchCol = ''
    this.jsonColumns = []
    this.logger = getLogger(`models/${this.name}`)
  }

  async init(filename) {
    if (!filename) {
      throw new Error(
        `${this.name} model must be initialized with an sqlite3 file path`
      )
    }
    this.logger.debug({ filename, model: this.name }, `initializing model...`)
    this.db = await connect(filename)
    if (!(await this.db.schema.hasTable(this.name))) {
      this.logger.info({ filename, model: this.name }, 'table created')
      await this.db.schema.createTable(this.name, this.definition)
    }
    this.logger.debug({ filename, model: this.name }, 'initialized')
  }

  async list({ from = 0, size = 10, sort = 'id', searched } = {}) {
    const [, rawDir, rawSort] = searched
      ? [null, null, this.searchCol]
      : sort.match(/(-|\+)?(.+)/)
    const direction = rawDir || '+'
    const dataQuery = this.db
      .select()
      .from(this.name)
      .limit(size)
      .offset(from)
      .orderBy(rawSort, direction === '+' ? 'asc' : 'desc')
    const countQuery = this.db(this.name).count({ count: `${this.name}.id` })
    const results = (
      await (searched ? this.enrichForSearch(dataQuery, searched) : dataQuery)
    ).map(this.makeDeserializer())
    const total = (
      await (searched ? this.enrichForSearch(countQuery, searched) : countQuery)
    )[0].count
    this.logger.debug(
      { total, from, size, rawSort, direction, hitCount: results.length },
      'returned list page'
    )
    return { total, from, size, sort: `${direction}${rawSort}`, results }
  }

  async getById(id) {
    const result = await this.db.where('id', id).select().from(this.name)
    this.logger.debug({ id, found: result.length > 0 }, 'fetch by id')
    if (result.length === 0) {
      return null
    }
    return this.makeDeserializer()(result[0])
  }

  async getByIds(ids) {
    const results = (
      await this.db.whereIn('id', ids).select().from(this.name)
    ).map(this.makeDeserializer())
    this.logger.debug({ ids, hitCount: results.length }, `fetch by ids`)
    return results
  }

  async save(data) {
    if (!Array.isArray(data)) {
      data = [data]
    }
    this.logger.debug({ data }, `saving`)
    const saved = data.map(this.makeSerializer())
    const cols = Object.keys(saved[0])
    return this.db.raw(
      `? on conflict (\`id\`) do update set ${cols
        .map(col => `\`${col}\` = excluded.\`${col}\``)
        .join(', ')}`,
      [this.db(this.name).insert(saved)]
    )
  }

  async removeByIds(ids) {
    return this.db.transaction(async trx => {
      this.logger.debug({ ids }, `removing`)
      const previous = await trx(this.name).select().whereIn('id', ids)
      await trx(this.name).whereIn('id', ids).delete()
      return previous.map(this.makeDeserializer())
    })
  }

  async reset() {
    if (await this.db.schema.hasTable(this.name)) {
      await this.db.schema.dropTable(this.name)
      this.logger.info('table dropped')
    }
    await this.init(this.db)
  }

  enrichForSearch(query, searched) {
    return query.where(this.searchCol, 'like', `%${searched.toLowerCase()}%`)
  }

  makeDeserializer() {
    return data => {
      for (const column of this.jsonColumns) {
        try {
          data[column] = JSON.parse(data[column])
        } catch (err) {
          throw new Error(
            `failed to deserialize value "${data[column]}" for col ${column}: ${err.message}`
          )
        }
      }
      return data
    }
  }

  makeSerializer() {
    return data => {
      const saved = { ...data }
      for (const column of this.jsonColumns) {
        saved[column] = JSON.stringify(saved[column] || null)
      }
      return saved
    }
  }
}
