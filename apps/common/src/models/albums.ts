import type { Knex } from 'knex'
import { type Reference, parseRawRefArray, uniqRef } from '../utils/refs.ts'
import { AbstractTrackList } from './abstract-track-list.ts'
import { tracksModel } from './tracks.ts'

export interface Album {
	id: number
	name: string
	trackIds: number[]
	removedTrackIds?: number[]
	/** references to contained album's artists. */
	refs: Reference[]
	/** full path to the media file for this album. */
	media?: string
	/** count incremented on every media change. */
	mediaCount: number
	/** epoch of the last automatic media retrieval. */
	mtimeMs: number
	/** agent monitoring this album. */
	agentId: number | null
}

/**
 * Manager for Album models. The seached column is name.
 * Has references to artists.
 */
export class AlbumsModel extends AbstractTrackList<Album> {
	constructor() {
		super({ name: 'albums', searchCol: 'name' })
	}

	/**
	 * Returns models by their album name (does not consider case).
	 * @param name The searched name
	 */
	async getByName(name: string) {
		const query = this.db?.select().from(this.name)
		if (this.dbKind === 'pg') {
			query?.whereILike('name', name)
		} else {
			query?.whereRaw('name = ? collate nocase', name)
		}
		const results = ((await query) ?? []).map(this.makeDeserializer())
		this.logger.debug({ name, hitCount: results.length }, 'fetch by name')
		return results
	}

	/**
	 * Computes references to artists from the contained tracks.
	 * @param trx The Knex transation
	 * @param trackIds The ids of the referenced tracks.
	 */
	protected async computeRefs<Record extends {}, Result>(
		trx: Knex.Transaction<Record, Result>,
		trackIds: number[]
	) {
		const refs: { artistRefs: string | Reference[] }[] = await trx(
			tracksModel.name
		)
			.whereIn('id', trackIds)
			.select('artistRefs')
		return uniqRef(
			refs.reduce((all, { artistRefs }) => {
				const artists =
					this.dbKind === 'sqlite3'
						? parseRawRefArray(artistRefs as string)
						: (artistRefs as Reference[])
				if (artists) {
					all.push(...artists)
				}
				return all
			}, [] as Reference[])
		)
	}

	/** Extends parent serializer to apply unknown name. */
	protected makeSerializer() {
		const serializer = super.makeSerializer()
		return (input: Partial<Album>) => {
			const result = serializer(input)
			result.name = result.name ?? null
			return result
		}
	}
}

export const albumsModel = new AlbumsModel()
