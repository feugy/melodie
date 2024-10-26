import type { Knex } from 'knex'
import type { DBConf, PartialWithReq, Tags } from '../types.ts'
import { hash } from '../utils/hash.ts'
import type { Reference } from '../utils/refs.ts'
import { AbstractModel } from './abstract-model.ts'

export interface Track {
	/** inode of the track file. */
	id: number
	/** epoch of the last modification. */
	mtimeMs: number
	/** full path to the track file. */
	path: string
	/** full path to the media file for this track. */
	media?: string
	/** count incremented on every media change. */
	mediaCount: number
	/** media metadatas. */
	tags: Tags
	/** references to the track's artists. */
	artistRefs: Reference[]
	/** reference to the track's album. */
	albumRef: Reference | null
	/** agent monitoring this track */
	agentId: number | null
}

/**
 * Manager for Tracks model. The seached column is tags.title.
 * Has references to artists and albums.
 */
export class TracksModel extends AbstractModel<Track> {
	constructor() {
		super({
			name: 'tracks',
			jsonColumns: ['tags', 'artistRefs', 'albumRef'],
			searchCol: 'title.value'
		})
	}

	/** Extends inherited to support database-specific search column. */
	async init(configuration?: DBConf) {
		await super.init(configuration)
		this.searchCol =
			(this.dbKind === 'pg' && this.db?.raw(`tags ->> 'title'`)) ||
			'title.value'
	}

	/** Lists model ids and modification time, for comparison purposes, without pagination. */
	async listWithTime() {
		const result = new Map<number, number>()
		for (const { id, mtimeMs } of (await this.db?.(this.name).select(
			'id',
			'mtimeMs'
		)) ?? []) {
			result.set(id, mtimeMs)
		}
		this.logger.debug({ hitCount: result.size }, 'list with time')
		return result
	}

	/**
	 * Returns models by their paths.
	 * It uses like operator so we can list tracks by their containing folder.
	 * @param paths Searched paths.
	 */
	async getByPaths(paths: string[]) {
		if (!this.db) return []
		const query = this.db(this.name)
		for (const path of paths) {
			query.orWhere('path', 'like', `${path}%`)
		}
		const results = (await query.select()).map(this.makeDeserializer())
		this.logger.debug({ paths, hitCount: results.length }, 'fetch by paths')
		return results
	}

	/**
	 * Saves given track model to database.
	 * It creates new record when needed, and updates existing ones (based on provided id).
	 * Partial update is supported: incoming data is merged with previous.
	 * Returns previous and current state for each model, to allow spotting changes in tags.
	 * @param data Single or array of saved (partial) tracks
	 */
	async save(
		data:
			| PartialWithReq<Track, 'id' | 'tags'>
			| PartialWithReq<Track, 'id' | 'tags'>[]
	) {
		if (!this.db) throw new Error('model not initialized')
		const input = Array.isArray(data) ? data : [data]
		this.logger.debug({ data: input }, 'saving')
		const serialize = this.makeSerializer()
		const deserialize = this.makeDeserializer()
		const saved = input.map(track => {
			const { album, albumartist, artists } = track.tags
			return {
				...track,
				albumRef: album
					? [hash(albumartist ? `${album} --- ${albumartist}` : album), album]
					: [1, null],
				artistRefs: artists?.length
					? [albumartist, ...artists]
							.reduce((artists, name) => {
								if (name && !artists.includes(name)) {
									artists.push(name)
								}
								return artists
							}, [] as string[])
							.map(artist => [hash(artist), artist])
					: [[1, null]]
			} as Track
		})
		return this.db.transaction(async trx => {
			const old = await trx(this.name)
				.select('id', 'artistRefs', 'albumRef', 'tags')
				.whereIn(
					'id',
					saved.map(({ id }) => id)
				)
			await trx(this.name).insert(saved.map(serialize)).onConflict('id').merge()
			return saved.map(current => {
				const previous = old.find(({ id }) => id === current.id)
				return {
					current,
					previous: previous ? deserialize(previous) : null
				}
			})
		})
	}

	/**
	 * Implementes search with tags' titles
	 * @param {QueryBuilder} query - Knex query builder to customize
	 * @param {string} searched - searched text
	 * @returns {QueryBuilder} customized Knex query builder
	 */
	protected enrichForSearch(query: Knex.QueryBuilder, searched: string) {
		if (this.dbKind === 'pg') {
			return query.whereILike(this.searchCol as string, `%${searched}%`)
		}
		return query
			.select(`${this.name}.*`)
			.joinRaw(`, json_each(tags, '$.title') as title`)
			.where(this.searchCol as string, 'like', `%${searched.toLowerCase()}%`)
	}

	/* Extends parent serializer to remove default nulls and apply default values.  */
	protected makeDeserializer() {
		const deserialize = super.makeDeserializer()
		return (input: Track) => {
			const result = deserialize(input)
			// Knex does not apply default values
			result.mediaCount = result.mediaCount ?? 1
			result.media = result.media ?? undefined
			return result
		}
	}
}

export const tracksModel = new TracksModel()
