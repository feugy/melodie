import { type Reference, parseRawRefArray, uniqRef } from '../utils/refs.ts'
import { whereIn } from '../utils/sqlite.ts'
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
	media: string | null
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
		const results =
			this.db
				?.query<Album, { name: string }>(
					`SELECT * FROM ${this.name} WHERE name = :name COLLATE NOCASE`
				)
				.all({ name })
				.map(this.makeDeserializer()) ?? []
		this.logger.debug({ name, hitCount: results.length }, 'fetch by name')
		return results
	}

	/**
	 * Computes references to artists from the contained tracks.
	 * @param trackIds The ids of the referenced tracks.
	 */
	protected computeRefs<Record extends {}, Result>(trackIds: number[]) {
		const refs =
			this.db
				?.query<{ artistRefs: string }, number[]>(
					`SELECT artistRefs FROM ${tracksModel.name} WHERE ${whereIn('id', trackIds)}`
				)
				.all(...trackIds) ?? []
		return uniqRef(
			refs.reduce((all, { artistRefs }) => {
				const artists = parseRawRefArray(artistRefs)
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
