'use strict'

const knex = require('knex')
const fs = require('fs-extra')
const { getLogger } = require('../utils')

let db

async function connect(filename, logger) {
  if (!db) {
    logger.debug({ filename }, `initializing database file...`)
    await fs.ensureFile(filename)
    logger.debug({ filename }, `connecting...`)
    logger.deprecate = logger.info
    db = knex({
      client: 'sqlite3',
      useNullAsDefault: true,
      connection: { filename },
      log: logger
    })
    logger.debug({ filename }, `migrating to latest...`)
    await db.migrate.latest()
    const version = await db.migrate.currentVersion()
    logger.info(
      { filename, version },
      `database connection ready on version ${version}`
    )
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

  constructor({ name, searchCol = '', jsonColumns = [] }) {
    if (!name) {
      throw new Error(`every model needs a name`)
    }
    this.name = name
    this.searchCol = searchCol
    this.jsonColumns = jsonColumns
    this.logger = getLogger(`models/${this.name}`)
  }

  async init(filename) {
    if (!filename) {
      throw new Error(
        `${this.name} model must be initialized with an sqlite3 file path`
      )
    }
    this.db = await connect(filename, this.logger)
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
    await this.db(this.name).delete()
    this.logger.info('table truncated')
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
