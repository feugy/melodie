import { Database } from 'bun:sqlite'
import type { DBConf, Page, PartialWithReq } from '../types.ts'
import { type Logger, getLogger } from '../utils/logger.ts'
import {
	type Migration,
	getCurrentVersion,
	migrateToLatest
} from '../utils/migrations.ts'
import type { Reference } from '../utils/refs.ts'
import { buildUpsert, whereIn } from '../utils/sqlite.ts'
import * as migrations from './migrations/index.ts'

let _db: Database | null = null

export const searchPlaceholder = '/*SRCH*/'

/**
 * Connects to database, creating file if it does not exist, applying migrations up to latest, and
 * storing database conneciton as a global variable.
 * @param conf database configuration
 * @param logger Logger used
 * @param migrate If true, applies migrations to latest version
 */
async function connect(conf: DBConf, logger: Logger, migrate: boolean) {
	if (!_db) {
		logger.debug('connecting...', { conf })
		_db = new Database(conf.filename, { strict: true, create: true })
		_db.exec('PRAGMA journal_mode = WAL')
		if (migrate) {
			logger.debug('migrating to latest...', { conf })
			await migrateToLatest(
				_db,
				Object.keys(migrations).map(
					name =>
						// @ts-expect-error -- TS doesn't like we dynamically read properties of exports
						({ name, ...migrations[name] }) as Migration
				)
			)
		}
		const version = await getCurrentVersion(_db)
		logger.info(`database connection ready on version ${version}`, {
			conf,
			version
		})
	}
	return _db
}

/**
 * Base class for all database models, provides CRUD operations on a single SQLite table.
 */
export abstract class AbstractModel<T extends { id: string | number }> {
	/** Model name, used at table name. */
	name: string

	/** Column used for searches. */
	searchCol: string

	/** Array of column names storing JSON content. */
	jsonColumns: string[]

	/** Logger specific to this model class. */
	logger: Logger

	/** Database connection. */
	db: Database | null = null

	/** Database kind. */
	dbKind: 'sqlite3' | 'pg' | null = null

	/** Release database connection (useful during tests). */
	static async release() {
		if (_db) {
			await _db.close()
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
		this.searchCol = searchCol ?? 'id'
		this.jsonColumns = jsonColumns ?? []
		this.logger = getLogger(`models/${this.name}`)
	}

	/**
	 * Connects to SQLite database, getting a database connection and applying migrations if needed.
	 * @param configuration configuration to the database.
	 * @param migrate If true, applies migrations to latest version
	 */
	async init(configuration?: DBConf, migrate = true) {
		if (!configuration) {
			throw new Error(
				`${this.name} model must be initialized with a database configuration`
			)
		}
		this.db = await connect(configuration, this.logger, migrate)
		this.logger.debug(`${this.name} model connected to database`, {
			configuration,
			name: this.name
		})
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
		searched,
		exactSearch = false
	}: {
		from?: number
		size?: number
		sort?: string
		searched?: string
		exactSearch?: boolean
	} = {}) {
		if (!this.db) throw new Error('model not initialized')
		const [, rawDir, rawSort] = searched
			? [null, null, this.searchCol]
			: (sort.match(/(-|\+)?(.+)/) as [unknown, string, string])
		const direction = rawDir || '+'

		const dataQuery = `SELECT * FROM ${this.name} WHERE 1=1 ${searchPlaceholder} 
		ORDER BY ${rawSort} ${direction === '+' ? 'asc' : 'desc'} LIMIT :size OFFSET :from`
		const countQuery = `SELECT COUNT(*) AS count FROM ${this.name} WHERE 1=1 ${searchPlaceholder}`

		const params: { size: number; from: number; searched?: string } = {
			size,
			from
		}
		if (searched) {
			params.searched = exactSearch ? searched : `%${searched}%`
		}
		const query = this.enrichForSearch(dataQuery, searched, exactSearch)
		const results = this.db
			.query<T, typeof params>(query)
			.all(params)
			.map(this.makeDeserializer())
		const total =
			this.db
				.query<{ count: number }, typeof params>(
					this.enrichForSearch(countQuery, searched, exactSearch)
				)
				.get(params)?.count ?? 0
		this.logger.debug('returned list page', {
			total,
			from,
			size,
			rawSort,
			direction,
			hitCount: results.length
		})
		return {
			total,
			from,
			size,
			sort: `${direction}${rawSort}`,
			results
		} as Page<T>
	}

	/**
	 * @returns the total number of models.
	 */
	async count() {
		if (!this.db) throw new Error('model not initialized')
		return (
			this.db
				.query<{ count: number }, []>(
					`SELECT COUNT(*) AS count FROM ${this.name}`
				)
				.get()?.count ?? 0
		)
	}

	/**
	 * Get a single model by its id.
	 * @param id Desired id
	 * @returns matching model, or null
	 */
	async getById(id: T['id']) {
		const result = this.db
			?.query<T, { id: T['id'] }>(`SELECT * FROM ${this.name} WHERE id = :id`)
			.get({ id })
		this.logger.debug('fetch by id', { id, found: Boolean(result) })
		if (!result) {
			return null
		}
		return this.makeDeserializer()(result)
	}

	/**
	 * Get several models by their id.
	 * Ids that do not match any model are simply ignored.
	 * Returned models follow input id ordering, including duplicate ids.
	 * @param ids Desired ids
	 * @returns array of matching model (may be empty)
	 */
	async getByIds(ids: T['id'][]) {
		const fetched =
			this.db
				?.query<T, T['id'][]>(
					`SELECT * FROM ${this.name} WHERE ${whereIn('id', ids)}`
				)
				.all(...ids)
				?.map(this.makeDeserializer()) ?? []
		const byId = new Map(fetched.map(model => [model.id, model]))
		const results = ids.reduce<T[]>((result, id) => {
			const model = byId.get(id)
			if (model) {
				result.push(model)
			}
			return result
		}, [])
		this.logger.debug('fetch by ids', { ids, hitCount: results.length })
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
		this.logger.debug('saving', { data: input })
		const saved = input.map(this.makeSerializer())
		const upsert = this.db.prepare(buildUpsert(this.name, saved))
		return this.db.transaction(models => {
			for (const model of models) {
				upsert.run(model)
			}
		})(saved)
	}

	/**
	 * Removes models by their ids.
	 * Unmatching ids will be simply ignored
	 * @param ids Ids of removed models
	 * @returns list (may be empty) of removed models
	 */
	async removeByIds(ids: T['id'][]): Promise<T[]> {
		if (!this.db) throw new Error('model not initialized')
		return this.db
			.transaction(() => {
				this.logger.debug('removing', { ids })
				const previous = this.db
					?.query<T, T['id'][]>(
						`SELECT * FROM ${this.name} WHERE ${whereIn('id', ids)}`
					)
					.all(...ids)
				this.db?.run(
					`DELETE FROM ${this.name} WHERE ${whereIn('id', ids)}`,
					ids
				)
				return previous
			})()
			.map(this.makeDeserializer())
	}

	/** Deletes all models in table!! */
	async reset() {
		this.db?.run(`DELETE FROM ${this.name}`)
		this.logger.info('table truncated')
	}

	/**
	 * Internal function intended to subclasses, to customize searches.
	 * Default implementation use like operator.
	 * @param query query to customize
	 * @param searched searched text
	 * @returns customized query
	 */
	protected enrichForSearch(
		query: string,
		searched?: string,
		exactSearch?: boolean
	) {
		return searched?.length
			? query.replace(searchPlaceholder, `AND ${this.searchCol} LIKE :searched`)
			: query
	}

	/**
	 * Internal function intended to subclasses, to customize deserialization.
	 * Default implementation parses data from json columns.
	 * @returns a deserialization function that takes database row and return parsed model
	 */
	protected makeDeserializer() {
		return (input: T) => {
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
	}

	/**
	 * Internal function intended to subclasses, to customize serialization.
	 * Default implementation stringifies data to json columns.
	 * **Note** the returned object must not contain undefined values for columns
	 * @returns a serialization function that takes model and returns database row
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
	 * @param ids List of references
	 * @returns a list (possibly empty) of artist references
	 */
	protected computeRefs(ids: T['id'][]): Reference[] {
		return []
	}
}
