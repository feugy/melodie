import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import knex from 'knex'
import type { Knex } from 'knex'
import pg from 'pg'
import type { DBConf, Page, PartialWithReq } from '../types.ts'
import { type Logger, getLogger } from '../utils/logger.ts'
import type { Reference } from '../utils/refs.ts'

// so count queries return numbers
// @see https://github.com/brianc/node-pg-types?tab=readme-ov-file#use
pg.types.setTypeParser(20, val => Number.parseInt(val, 10))

let _db: Knex | null = null

/**
 * Connects to database, creating file if it does not exist, applying migrations up to latest, and
 * storing database conneciton as a global variable.
 * @param conf Knex database configuration
 * @param logger Logger used
 * @param migrate If true, applies migrations to latest version
 * @see http://knexjs.org
 */
async function connect(conf: DBConf, logger: Logger, migrate: boolean) {
	if (!_db) {
		logger.debug({ conf }, 'initializing database file...')
		if (conf.kind === 'sqlite3') {
			await mkdir(dirname(conf.filename), { recursive: true })
		}
		logger.debug({ conf }, 'connecting...')
		_db = knex({
			client: conf.kind,
			useNullAsDefault: true,
			connection: conf,
			pool: conf.kind === 'pg' ? { min: 0, max: 10 } : undefined,
			migrations: {
				directory: resolve(
					dirname(fileURLToPath(import.meta.url)),
					'migrations'
				)
			},
			log: {
				deprecate: logger.info.bind(logger),
				warn: logger.warn.bind(logger),
				error: logger.error.bind(logger),
				debug: logger.debug.bind(logger)
			}
		})
		if (migrate) {
			logger.debug({ conf }, 'migrating to latest...')
			await _db.migrate.latest()
		}
		const version = await _db.migrate.currentVersion()
		logger.info(
			{ conf, version },
			`database connection ready on version ${version}`
		)
	}
	return _db
}

/**
 * Base class for all database models, provides CRUD operations on a single SQLite table.
 * Uses Knex as a layer to access database.
 */
export abstract class AbstractModel<T extends { id: number }> {
	/** Model name, used at table name. */
	name: string

	/** Column used for searches. */
	searchCol: string | Knex.Raw

	/** Array of column names storing JSON content. */
	jsonColumns: string[]

	/** Logger specific to this model class. */
	logger: Logger

	/** Database connection. */
	db: Knex | null = null

	/** Database kind. */
	dbKind: 'sqlite3' | 'pg' | null = null

	/** Release database connection (useful during tests). */
	static async release() {
		if (_db) {
			await _db.destroy()
			_db = null
		}
	}

	/** Builds a model manager, that can handle records of a given SQL table. */
	constructor({
		name,
		searchCol = '',
		jsonColumns = []
	}: { name: string; searchCol?: string; jsonColumns?: string[] }) {
		if (!name) {
			throw new Error('every model needs a name')
		}
		this.name = name
		this.searchCol = searchCol
		this.jsonColumns = jsonColumns
		this.logger = getLogger(`models/${this.name}`)
	}

	/**
	 * Connects to SQLite database, getting a database connection and applying migrations if needed.
	 * @param configuration Knex configuration to the database.
	 * @param migrate If true, applies migrations to latest version
	 */
	async init(configuration?: DBConf, migrate = true) {
		if (!configuration) {
			throw new Error(
				`${this.name} model must be initialized with a database configuration`
			)
		}
		this.db = await connect(configuration, this.logger, migrate)
		this.logger.debug(
			{ configuration, name: this.name },
			`${this.name} model connected to database`
		)
		this.dbKind = configuration.kind
	}

	/**
	 * Lists models within table, with pagination and sort.
	 * Also supports searches, when the searched text is provided.
	 * @param args List arguments, including:
	 * @param args.from 0-based index of the first result
	 * @param args.size Maximum number of records returned after first results
	 * @param args.sort Column used for sorting. Use + for ascending order (default) or - for descending
	 * @param args.searched Text used when searching (optional)
	 * @returns a given page of models
	 */
	async list({
		from = 0,
		size = 10,
		sort = 'id',
		searched
	}: { from?: number; size?: number; sort?: string; searched?: string } = {}) {
		if (!this.db) throw new Error('model not initialized')
		const [, rawDir, rawSort] = searched
			? [null, null, this.searchCol]
			: (sort.match(/(-|\+)?(.+)/) as [unknown, string, string])
		const direction = rawDir || '+'
		const dataQuery = this.db
			.select()
			.from(this.name)
			.limit(size)
			.offset(from)
			.orderBy(rawSort as string, direction === '+' ? 'asc' : 'desc')
		const countQuery = this.db(this.name).count({ count: `${this.name}.id` })
		const results = (
			await (searched ? this.enrichForSearch(dataQuery, searched) : dataQuery)
		).map(this.makeDeserializer())
		const total = Number.parseInt(
			(
				await (searched
					? this.enrichForSearch(countQuery, searched)
					: countQuery)
			)[0].count
		)
		this.logger.debug(
			{ total, from, size, rawSort, direction, hitCount: results.length },
			'returned list page'
		)
		return {
			total,
			from,
			size,
			sort: `${direction}${rawSort}`,
			results
		} as Page<T>
	}

	/**
	 * Get a single model by its id.
	 * @param id Desired id
	 * @returns matching model, or null
	 */
	async getById(id: number) {
		const result = await this.db?.where('id', id).select().from(this.name)
		this.logger.debug({ id, found: (result?.length ?? 0) > 0 }, 'fetch by id')
		if (!result || result.length === 0) {
			return null
		}
		return this.makeDeserializer()(result[0])
	}

	/**
	 * Get several models by their id.
	 * Ids that do not match any model are simply ignored.
	 * _Note_: does not guarantee that result ordering will match input ordering.
	 * @param ids Desired ids
	 * @returns array of matching model (may be empty)
	 */
	async getByIds(ids: number[]) {
		const results =
			(await this.db?.whereIn('id', ids).select().from(this.name))?.map(
				this.makeDeserializer()
			) ?? []
		this.logger.debug({ ids, hitCount: results?.length }, 'fetch by ids')
		return results
	}

	/**
	 * Saves given model to database.
	 * It creates new record when needed, and updates existing ones (based on provided id).
	 * Partial update is supported: incoming data is merged with previous.
	 * @param data Single or array of saved (partial) models
	 */
	async save(
		data: PartialWithReq<T, 'id'> | PartialWithReq<T, 'id'>[]
	): Promise<unknown> {
		if (!this.db) throw new Error('model not initialized')
		const input = Array.isArray(data) ? data : [data]
		this.logger.debug({ data: input }, 'saving')
		const saved = input.map(this.makeSerializer())
		return this.db(this.name).insert(saved).onConflict('id').merge()
	}

	/**
	 * Removes models by their ids.
	 * Unmatching ids will be simply ignored
	 * @param ids Ids of removed models
	 * @returns list (may be empty) of removed models
	 */
	async removeByIds(ids: number[]) {
		if (!this.db) throw new Error('model not initialized')
		return this.db.transaction(async trx => {
			this.logger.debug({ ids }, 'removing')
			const previous = await trx(this.name).select().whereIn('id', ids)
			await trx(this.name).whereIn('id', ids).delete()
			return previous.map(this.makeDeserializer())
		})
	}

	/** Deletes all models in table!! */
	async reset() {
		await this.db?.(this.name).delete()
		this.logger.info('table truncated')
	}

	/**
	 * Internal function intended to subclasses, to customize searches.
	 * Default implementation use like operator.
	 * @param query Knex query builder to customize
	 * @param searched Searched text
	 * @returns customized Knex query builder
	 * @see http://knexjs.org/#Builder
	 */
	protected enrichForSearch(query: Knex.QueryBuilder, searched: string) {
		return this.dbKind === 'sqlite3'
			? query.whereLike(this.searchCol as string, `%${searched.toLowerCase()}%`)
			: query.where(this.searchCol as string, '~*', `.*${searched}.*`)
	}

	/**
	 * Internal function intended to subclasses, to customize deserialization.
	 * Default implementation parses data from json columns.
	 * @returns a deserialization function that takes raw knex result and return parsed model
	 */
	protected makeDeserializer() {
		return (input: T) => {
			if (this.dbKind === 'sqlite3') {
				const data = input as unknown as Record<string, string>
				for (const column of this.jsonColumns) {
					try {
						data[column] = JSON.parse(data[column])
					} catch (err) {
						throw new Error(
							`failed to deserialize value "${data[column]}" for col ${column}: ${(err as Error).message}, ${JSON.stringify(data)}`
						)
					}
				}
				return data as unknown as T
			}
			return input
		}
	}

	/**
	 * Internal function intended to subclasses, to customize serialization.
	 * Default implementation stringifies data to json columns.
	 * **Note** the returned object must not contain undefined values for columns
	 * @returns a serialization function that takes model and returns raw data for knex
	 */
	protected makeSerializer() {
		return (input: Partial<T>) => {
			const data = input as unknown as Record<string, string>
			const saved = { ...data }
			for (const column of this.jsonColumns) {
				saved[column] = JSON.stringify(
					saved[column] === undefined ? null : saved[column]
				)
			}
			return saved as unknown as T
		}
	}

	/**
	 * Builds references to related model. does nothing by default
	 * @param trx The Knex transation
	 * @param ids List of references
	 * @returns a list (possibly empty) of artist references
	 */
	protected async computeRefs(
		trx: Knex.Transaction,
		ids: number[]
	): Promise<Reference[]> {
		return []
	}
}
