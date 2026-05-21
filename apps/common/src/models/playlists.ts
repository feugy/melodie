import {
	type Reference,
	parseRawRef,
	parseRawRefArray,
	uniqRef
} from '../utils/refs.ts'
import { whereIn } from '../utils/sqlite.ts'
import { AbstractTrackList } from './abstract-track-list.ts'
import { tracksModel } from './tracks.ts'

export interface Playlist {
	id: number
	/** epoch of the last automatic media retrieval. */
	mtimeMs: number
	name: string
	trackIds: number[]
	removedTrackIds?: number[]
	/** temporary storage for tracks when importing a file. */
	trackPaths?: string[]
	/** references to contained track's artists and albums. */
	refs: Reference[]
	/** full path to the media file for this playlist. */
	media: string | null
	/** count incremented on every media change. */
	mediaCount: number
	userIds: number[]
}

/**
 * Manager for Playlist models. Search is not supported yet.
 * Playlist do not merge their tracks, and can have duplicates
 * Has references to albums and artists of the contained tracks.
 */
export class PlaylistModel extends AbstractTrackList<Playlist> {
	constructor() {
		super({
			name: 'playlists',
			jsonColumns: ['trackPaths', 'userIds'],
			// TODO search on name as well
			searchCol: 'refs',
			mergeTrackIds: false
		})
	}

	/**
	 * Computes references to albums and artists from the contained tracks.
	 * @param trackIds The ids of the contained tracks.
	 */
	protected computeRefs<Record extends {}, Result>(trackIds: number[]) {
		const refs =
			this.db
				?.query<{ artistRefs: string; albumRef: string }, number[]>(
					`SELECT artistRefs, albumRef FROM ${tracksModel.name} WHERE ${whereIn('id', trackIds)}`
				)
				.all(...trackIds) ?? []
		return uniqRef(
			refs.reduce((all, { artistRefs, albumRef }) => {
				const artists = parseRawRefArray(artistRefs)
				if (artists) {
					all.push(...artists)
				}
				const album = parseRawRef(albumRef)
				if (album) {
					all.push(album)
				}
				return all
			}, [] as Reference[])
		)
	}

	/** Lists model ids and modification time, for comparison purposes, without pagination. */
	async listWithTime() {
		const result = new Map<number, number>()
		for (const { id, mtimeMs } of this.db
			?.query<Playlist, null>(`SELECT id, mtimeMs FROM ${this.name}`)
			.all(null) ?? []) {
			result.set(id, mtimeMs)
		}
		this.logger.debug('list with time', { hitCount: result.size })
		return result
	}
}

export const playlistsModel = new PlaylistModel()
