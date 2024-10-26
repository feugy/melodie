import type { Knex } from 'knex'
import {
	type Reference,
	parseRawRef,
	parseRawRefArray,
	uniqRef
} from '../utils/refs.ts'
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
	media?: string
	/** count incremented on every media change. */
	mediaCount: number
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
			jsonColumns: ['trackPaths'],
			// TODO search on name as well
			searchCol: 'refs',
			mergeTrackIds: false
		})
	}

	/**
	 * Computes references to albums and artists from the contained tracks.
	 * @param trx The Knex transation.
	 * @param trackIds The ids of the contained tracks.
	 */
	protected async computeRefs<Record extends {}, Result>(
		trx: Knex.Transaction<Record, Result>,
		trackIds: number[]
	) {
		const refs: {
			albumRef: string | Reference
			artistRefs: string | Reference[]
		}[] = await trx(tracksModel.name)
			.whereIn('id', trackIds)
			.select('albumRef', 'artistRefs')
		return uniqRef(
			refs.reduce((all, { artistRefs, albumRef }) => {
				const artists =
					this.dbKind === 'sqlite3'
						? parseRawRefArray(artistRefs as string)
						: (artistRefs as Reference[])
				if (artists) {
					all.push(...artists)
				}
				const album =
					this.dbKind === 'sqlite3'
						? parseRawRef(albumRef as string)
						: (albumRef as Reference)
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
		for (const { id, mtimeMs } of (await this.db?.(this.name).select(
			'id',
			'mtimeMs'
		)) ?? []) {
			result.set(id, mtimeMs)
		}
		this.logger.debug({ hitCount: result.size }, 'list with time')
		return result
	}
}

export const playlistsModel = new PlaylistModel()
