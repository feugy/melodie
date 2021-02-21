'use strict'

const { resolve } = require('path')
const knex = require('knex')
const { FsMigrations } = require('knex/lib/migrate/sources/fs-migrations')
const fs = require('fs-extra')
const { getLogger } = require('../utils')

let db

/**
 * Connects to database, creating file if it does not exist, applying migrations up to latest, and
 * storing database conneciton as a global variable.
 * @async
 * @param {string} filename - path to SQLite database file
 * @param {Pino} logger     - logger used
 * @returns {Knex} Knex global object
 * @see http://knexjs.org
 */
async function connect(filename, logger) {
  if (!db) {
    logger.debug({ filename }, `initializing database file...`)
    await fs.ensureFile(filename)
    logger.debug({ filename }, `connecting...`)
    logger.deprecate = logger.info.bind(logger)
    db = knex({
      client: 'sqlite3',
      useNullAsDefault: true,
      connection: { filename },
      migrations: {
        // settings directory option works, but generates many warnings in logs
        // https://github.com/knex/knex/issues/3921
        migrationSource: new FsMigrations(resolve(__dirname, 'migrations'))
      },
      log: {
        deprecated: logger.info.bind(logger),
        warn: logger.warn.bind(logger),
        error: logger.error.bind(logger),
        debug: logger.debug.bind(logger)
      }
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

/**
 * @class AbstractModel
 * Base class for all database models, provides CRUD operations on a single SQLite table.
 * Uses Knex as a layer to access database.
 */
module.exports = class AbstractModel {
  /**
   * Release database connection (useful during tests)
   * @static
   * @async
   */
  static async release() {
    if (db) {
      await db.context.destroy()
      db = null
    }
  }

  /**
   * Builds a model manager, that can handle records of a given SQL table.
   * @param {object} args                         - arguments, including:
   * @param {string} args.name                      - model name, used at table name
   * @param {string} [args.searchCol = '']          - column used for searches
   * @param {array<string>} [args.jsonColumns = []] - array of column names storing JSON content
   * @returns {AbstractModel} a model manager
   */
  constructor({ name, searchCol = '', jsonColumns = [] }) {
    if (!name) {
      throw new Error(`every model needs a name`)
    }
    this.name = name
    this.searchCol = searchCol
    this.jsonColumns = jsonColumns
    this.logger = getLogger(`models/${this.name}`)
  }

  /**
   * Connects to SQLite database, getting a database connection and applying migrations if needed.
   * @async
   * @param {string} filename - full path to the SQLite file.
   */
  async init(filename) {
    if (!filename) {
      throw new Error(
        `${this.name} model must be initialized with an sqlite3 file path`
      )
    }
    this.db = await connect(filename, this.logger)
  }

  /**
   * @typedef {object} Page
   * @property {number} total - total number of models
   * @property {number} size  - 0-based rank of the first model returned
   * @property {number} from  - maximum number of models per page
   * @property {string} sort  - sorting criteria used: direction (+ or -) then property (name, rank...)
   * @property {array<ArtistsModel|AlbumsModel|PlaylistsModel|TracksModel>} results - returned models
   */

  /**
   * Lists models within table, with pagination and sort.
   * Also supports searches, when the searched text is provided
   * @async
   * @param {object} args             - list arguments, including:
   * @param {number} [args.from = 0]    - 0-based index of the first result
   * @param {number} [args.size = 10]   - maximum number of records returned after first results
   * @param {string} [args.sort = 'id'] - column used for sorting.
   *                                      Use + for ascending order (default) or - for descending
   * @param {string} args.searched      - text used when searching (optional)
   * @returns {Page} a given page of models
   */
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

  /**
   * Get a single model by its id.
   * @async
   * @param {number} id - desired id
   * @returns {AbstractModel|null} matching model, or null
   */
  async getById(id) {
    const result = await this.db.where('id', id).select().from(this.name)
    this.logger.debug({ id, found: result.length > 0 }, 'fetch by id')
    if (result.length === 0) {
      return null
    }
    return this.makeDeserializer()(result[0])
  }

  /**
   * Get several models by their id.
   * Ids that do not match any model are simply ignored.
   * _Note_: does not guarantee that result ordering will match input ordering.
   * @async
   * @param {array<number>} ids - desired ids
   * @returns {array<AbstractModel>} array of matching model (may be empty)
   */
  async getByIds(ids) {
    const results = (
      await this.db.whereIn('id', ids).select().from(this.name)
    ).map(this.makeDeserializer())
    this.logger.debug({ ids, hitCount: results.length }, `fetch by ids`)
    return results
  }

  /**
   * Saves given model to database.
   * It creates new record when needed, and updates existing ones (based on provided id).
   * Partial update is supported: incoming data is merged with previous.
   * @async
   * @param {object|array<object>} data - single or array of saved (partial) models
   */
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

  /**
   * Removes models by their ids.
   * Unmatching ids will be simply ignored
   * @async
   * @param {array<number>} ids - ids of removed models
   * @returns {array<AbstractModel>} list (may be empty) of removed models
   */
  async removeByIds(ids) {
    return this.db.transaction(async trx => {
      this.logger.debug({ ids }, `removing`)
      const previous = await trx(this.name).select().whereIn('id', ids)
      await trx(this.name).whereIn('id', ids).delete()
      return previous.map(this.makeDeserializer())
    })
  }

  /**
   * Deletes all modesl in table!!
   * @async
   */
  async reset() {
    await this.db(this.name).delete()
    this.logger.info('table truncated')
  }

  /**
   * Internal function intended to subclasses, to customize searches.
   * Default implementation use like operator
   * @protected
   * @param {QueryBuilder} query - Knex query builder to customize
   * @param {string} searched - searched text
   * @returns {QueryBuilder} customized Knex query builder
   * @sedd http://knexjs.org/#Builder
   */
  enrichForSearch(query, searched) {
    return query.where(this.searchCol, 'like', `%${searched.toLowerCase()}%`)
  }

  /**
   * Internal function intended to subclasses, to customize deserialization.
   * Default implementation parses data from json columns.
   * @protected
   * @returns {function} a deserialization function that takes raw knex result and return parsed model
   */
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
      // SQLlist does not apply default values
      if (data.mediaCount === null) {
        data.mediaCount = 1
      }
      return data
    }
  }

  /**
   * Internal function intended to subclasses, to customize serialization.
   * Default implementation stringifies data to json columns.
   * @protected
   * @returns {function} a serialization function that takes model and returns raw data for knex
   */
  makeSerializer() {
    return data => {
      const saved = { ...data }
      for (const column of this.jsonColumns) {
        saved[column] = JSON.stringify(
          saved[column] === undefined ? null : saved[column]
        )
      }
      return saved
    }
  }
}
