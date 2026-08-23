import type { DBConf, PartialWithReq, Tags } from '../types.ts'
import { hash } from '../utils/hash.ts'
import type { Reference } from '../utils/refs.ts'
import { buildUpsert, whereIn } from '../utils/sqlite.ts'
import { AbstractModel, searchPlaceholder } from './abstract-model.ts'

export interface Track {
	/** inode of the track file. */
	id: number
	/** epoch of the last modification. */
	mtimeMs: number
	/** full path to the track file. */
	path: string
	/** path to the track file, relative to the music root folder. */
	relativePath?: string | null
	/** full path to the media file for this track. */
	media: string | null
	/** count incremented on every media change. */
	mediaCount: number
	/** media metadatas. */
	tags: Tags
	/** references to the track's artists. */
	artistRefs: Reference[] | null
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

	/** Lists model ids and modification time, for comparison purposes, without pagination. */
	async listWithTime() {
		const result = new Map<number, number>()
		for (const { id, mtimeMs } of this.db
			?.query<Track, null>(`SELECT id, mtimeMs FROM ${this.name}`)
			.all(null) ?? []) {
			result.set(id, mtimeMs)
		}
		this.logger.debug('list with time', { hitCount: result.size })
		return result
	}

	/**
	 * Returns models by their paths.
	 * It uses like operator so we can list tracks by their containing folder.
	 * @param paths Searched paths.
	 */
	async getByPaths(paths: string[]) {
		if (!this.db) return []

		const query = `SELECT * FROM ${this.name} WHERE ${paths.map(() => 'path like ?').join(' OR ')}`
		const params = paths.map(path => `${path}%`)
		const results = this.db
			.query<Track, string[]>(query)
			.all(...params)
			.map(this.makeDeserializer())
		this.logger.debug('fetch by paths', { paths, hitCount: results.length })
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
	): Promise<
		{
			current: Track
			previous: Pick<Track, 'id' | 'artistRefs' | 'albumRef' | 'tags'> | null
		}[]
	> {
		const input = Array.isArray(data) ? data : [data]
		this.logger.debug('saving', { data: input })
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
		return this.db?.transaction(() => {
			if (!this.db) throw new Error('model not initialized')
			const old = this.db
				.query<Track, number[]>(
					`SELECT id, artistRefs, albumRef, tags FROM ${this.name} WHERE ${whereIn('id', saved)}`
				)
				.all(...saved.map(({ id }) => id))
			const upsert = this.db.prepare(buildUpsert(this.name, saved))
			for (const model of saved) {
				upsert.run(serialize(model) as unknown as null)
			}
			return saved.map(current => {
				const previous = old.find(({ id }) => id === current.id)
				return {
					current,
					previous: previous ? deserialize(previous) : null
				}
			})
		})()
	}

	/**
	 * Implementes search with tags' titles
	 */
	protected enrichForSearch(query: string, searched: string) {
		return searched?.length
			? query
					.replace('SELECT *', `SELECT ${this.name}.*`)
					.replace(
						`FROM ${this.name}`,
						`FROM ${this.name}, json_each(tags, '$.title') as title`
					)
					.replace(searchPlaceholder, `AND ${this.searchCol} LIKE :searched`)
			: query
	}
}

export const tracksModel = new TracksModel()
