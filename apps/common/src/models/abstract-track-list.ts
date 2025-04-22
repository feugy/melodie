import type { PartialWithReq } from '../types.ts'
import { difference, uniq } from '../utils/collections.ts'
import type { Reference } from '../utils/refs.ts'
import { buildUpsert, whereIn } from '../utils/sqlite.ts'
import { AbstractModel } from './abstract-model.ts'

export interface TrackListModel {
	id: number
	trackIds: number[]
	refs: Reference[]
	removedTrackIds?: number[]
	media: string | null
	mediaCount: number
	mtimeMs: number
}

export interface TrackListSaveResult<T extends TrackListModel> {
	/** List (possibly empty) of saved models. */
	saved: AbstractTrackList<T>[]
	/** List (possibly empty) of removed model ids. */
	removedIds: number[]
}

/**
 * Base class for all models containing references to tracks: Albums, Artists, Playlists.
 * Computes references automatically, and ensures reference integrity.
 */
export abstract class AbstractTrackList<
	T extends TrackListModel
> extends AbstractModel<T> {
	/** Indicactes whether to merge newly saved with existing tracks. */
	mergeTrackIds: boolean

	/**
	 * Builds a tracklist model manager, that can handle records with references to tracks.
	 * @param args Arguments, including:
	 * @param args.mergeTrackIds True to merge newly saved with existing tracks.
	 * @param args.jsonColumns Array of column names storing JSON content.
	 */
	constructor({
		mergeTrackIds = true,
		jsonColumns = [],
		...rest
	}: {
		name: string
		mergeTrackIds?: boolean
		jsonColumns?: string[]
	} & ConstructorParameters<typeof AbstractModel<T>>[0]) {
		super({ jsonColumns: [...jsonColumns, 'trackIds', 'refs'], ...rest })
		this.mergeTrackIds = mergeTrackIds
	}

	/**
	 * Saves given tracklist model to database.
	 * It creates new record when needed, and updates existing ones (based on provided id).
	 * Partial update is supported: incoming data is merged with previous.
	 * Tracks can be added (in `trackIds`) and removed (in `removedTrackIds`).
	 * Given `mergeTrackIds` property, incoming track will be merged with existing tracks (unicity is guaranted),
	 * or will override them (duplicates are allowed).
	 *
	 * A model with no tracks will be automatically removed.
	 *
	 * References to other models are automatically computed, with computeRefs() method.
	 * @param data Single or array of saved (partial) models.
	 */
	async save(data: PartialWithReq<T, 'id'> | PartialWithReq<T, 'id'>[]) {
		const input = Array.isArray(data) ? data : [data]
		return this.db?.transaction(() => {
			if (!this.db) throw new Error('model not initialized')
			const previousModels = this.db
				.query<T, number[]>(
					`SELECT * FROM ${this.name} WHERE ${whereIn('id', input)}`
				)
				.all(...input.map(({ id }) => id))
				.map(this.makeDeserializer())

			const { saved, removedIds } = input.reduce(
				(result, { trackIds, removedTrackIds, ...trackList }) => {
					const previous =
						previousModels.find(({ id }) => id === trackList.id) ??
						({ mediaCount: 0, mtimeMs: 0 } as unknown as T)
					const saved = {
						// one can not update with sparse data: we have to get previous columns
						...previous,
						...trackList,
						trackIds: this.mergeTrackIds
							? uniq(
									difference(
										(previous?.trackIds ?? []).concat(trackIds ?? []),
										removedTrackIds ?? []
									)
								)
							: (trackIds ?? [])
					}
					if (saved.trackIds.length) {
						result.saved.push(saved)
					} else {
						result.removedIds.push(trackList.id)
					}
					return result
				},
				{ saved: [] as T[], removedIds: [] as number[] }
			)

			if (saved.length) {
				// we need to add refs before preparing the upsert
				for (const data of saved) {
					data.refs = this.computeRefs(data.trackIds)
				}
				const upsert = this.db.prepare(buildUpsert(this.name, saved))
				const serializer = this.makeSerializer()
				this.logger.debug({ data: saved }, 'saving')
				for (const data of saved) {
					upsert.run(serializer(data) as unknown as null)
				}
			}
			if (removedIds.length) {
				this.logger.debug({ ids: removedIds }, 'removing')
				this.db
					.query(`DELETE FROM ${this.name} WHERE ${whereIn('id', removedIds)}`)
					.run(...removedIds)
			}
			return { saved, removedIds }
		})()
	}

	/**
	 * Lists models without media, and that where not processed since a given date.
	 * Models which `mtimeMs` is after the provided date will be ignored.
	 * @param when Epoch before which models could be retrieved.
	 */
	async listMedialess(when: number) {
		const results = (
			this.db
				?.query<T, { when: number }>(`SELECT * FROM ${this.name} 
				WHERE media IS NULL 
				AND coalesce(mtimeMs, 0) <= :when
				ORDER BY name ASC
			`)
				.all({ when }) ?? []
		).map(this.makeDeserializer())
		this.logger.debug(
			{ hitCount: results.length, when },
			`list medialess since ${new Date(when).toISOString()}`
		)
		return results
	}

	/* Extends parent serializer to remove default nulls and apply default values.  */
	protected makeDeserializer() {
		const deserialize = super.makeDeserializer()
		return (input: T) => deserialize(input)
	}
}
