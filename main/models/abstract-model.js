'use strict'

const knex = require('knex')
const fs = require('fs-extra')

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

function deserialize(columns) {
  return function (data) {
    for (const column of columns) {
      data[column] = JSON.parse(data[column])
    }
    return data
  }
}

function serialize(columns) {
  return function (data) {
    const saved = { ...data }
    for (const column of columns) {
      saved[column] = JSON.stringify(saved[column] || null)
    }
    return saved
  }
}

module.exports = class AbstractModel {
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
    this.jsonColumns = []
  }

  async init(filename) {
    if (!filename) {
      throw new Error(
        `${this.name} model must be initialized with an sqlite3 file path`
      )
    }
    this.db = await connect(filename)
    if (!(await this.db.schema.hasTable(this.name))) {
      await this.db.schema.createTable(this.name, this.definition)
    }
  }

  async save(data) {
    if (!Array.isArray(data)) {
      data = [data]
    }
    const saved = data.map(serialize(this.jsonColumns))
    // console.log(`saving ${saved.length} ${this.name}...`)
    const cols = Object.keys(saved[0])
    await this.db.raw(
      `? on conflict (\`id\`) do update set ${cols
        .map(col => `\`${col}\` = excluded.\`${col}\``)
        .join(', ')}`,
      [this.db(this.name).insert(saved)]
    )
    // console.log(`done ${saved.length} ${this.name}!`)
  }

  async list({ from = 0, size = 10, sort = 'id' } = {}) {
    const [, rawDir, rawSort] = sort.match(/(-|\+)?(.+)/)
    const direction = rawDir || '+'
    const results = (
      await this.db
        .select()
        .from(this.name)
        .limit(size)
        .offset(from)
        .orderBy(rawSort, direction === '+' ? 'asc' : 'desc')
    ).map(deserialize(this.jsonColumns))
    const total = (await this.db(this.name).count({ count: 'id' }))[0].count
    return { total, from, size, sort: `${direction}${rawSort}`, results }
  }

  async getById(id) {
    const result = await this.db.where('id', id).select().from(this.name)
    if (result.length === 0) {
      return null
    }
    return deserialize(this.jsonColumns)(result[0])
  }

  async getByIds(ids) {
    return (await this.db.whereIn('id', ids).select().from(this.name)).map(
      deserialize(this.jsonColumns)
    )
  }

  async reset() {
    if (await this.db.schema.hasTable(this.name)) {
      await this.db.schema.dropTable(this.name)
    }
    await this.init(this.db)
  }
}
