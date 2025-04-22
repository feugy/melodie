import { type Reference, parseRawRef, uniqRef } from '../utils/refs.ts'
import { whereIn } from '../utils/sqlite.ts'
import { AbstractTrackList } from './abstract-track-list.ts'
import { tracksModel } from './tracks.ts'

export interface Artist {
	id: number
	name: string
	/** artist's bio (each key is a language code) */
	bio?: { [x: string]: string }
	trackIds: number[]
	removedTrackIds?: number[]
	/** references to contained artist's albums. */
	refs: Reference[]
	/** full path to the picture file for this artist. */
	media: string | null
	/** count incremented on every media change. */
	mediaCount: number
	/** epoch of the last automatic media retrieval. */
	mtimeMs: number
	/** agent monitoring this artist. */
	agentId: number | null
}

/**
 * Manager for Artist models. The seached column is name.
 * Has references to albums.
 */
export class ArtistsModel extends AbstractTrackList<Artist> {
	constructor() {
		super({ name: 'artists', searchCol: 'name', jsonColumns: ['bio'] })
	}

	/**
	 * Computes references to albums from the contained tracks.
	 * @param trackIds The ids of the referenced tracks.
	 */
	protected computeRefs<Record extends {}, Result>(trackIds: number[]) {
		const refs =
			this.db
				?.query<{ albumRef: string }, number[]>(
					`SELECT albumRef FROM ${tracksModel.name} WHERE ${whereIn('id', trackIds)}`
				)
				.all(...trackIds) ?? []
		return uniqRef(
			refs.reduce((all, { albumRef }) => {
				const album = parseRawRef(albumRef)
				if (album) {
					all.push(album)
				}
				return all
			}, [] as Reference[])
		)
	}

	/** Extends parent serializer to apply unknown name. */
	protected makeSerializer() {
		const serializer = super.makeSerializer()
		return (input: Partial<Artist>) => {
			const result = serializer(input)
			result.name = result.name ?? null
			return result
		}
	}
}

export const artistsModel = new ArtistsModel()
