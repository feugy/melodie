import {
	type Album,
	type Artist,
	type Track,
	albumsModel,
	artistsModel,
	tracksModel
} from '@melodie/common/models'
import type { PartialWithReq } from '@melodie/common/types'
import { type Reference, differenceRef } from '@melodie/common/utils'
import { type Logger, getLogger } from '@melodie/common/utils'

export class TracksService {
	logger: Logger

	constructor() {
		this.logger = getLogger('services/tracks')
	}

	/**
	 * Adds new or existing tracks to the database.
	 * It computes Albums and Artists references and updates the database accordingly.
	 * @param tracks - list of added tracks
	 */
	async add(tracks: Track[]) {
		this.logger.debug({ tracks }, 'add tracks')
		const albumChanges: Change[] = []
		const artistChanges: Change[] = []
		for (const { current, previous } of await tracksModel.save(tracks)) {
			const { id: trackId, agentId, media, albumRef, artistRefs } = current

			const removedAlbum = differenceRef([previous?.albumRef], [albumRef])
			if (albumRef) {
				albumChanges.push({ trackId, media, agentId, ref: albumRef })
			}
			albumChanges.push(
				...removedAlbum.map(ref => ({ trackId, ref, removed: true as const }))
			)

			const removedArtists = differenceRef(
				previous?.artistRefs || [],
				artistRefs
			)
			if (artistRefs) {
				artistChanges.push(
					...artistRefs.map(ref => ({ trackId, media, agentId, ref }))
				)
			}
			artistChanges.push(
				...removedArtists.map(ref => ({ trackId, ref, removed: true as const }))
			)
		}
		const albums = groupChangeByModel(albumChanges)
		if (albums.length) {
			this.logger.debug({ albums }, 'updating albums')
			await albumsModel.save(albums)
		}
		const artists = groupChangeByModel(artistChanges)
		if (artists.length) {
			this.logger.debug({ artists }, 'updating artists')
			await artistsModel.save(artists)
		}
	}

	/**
	 * Removes tracks from database, and updates any Albums and Artists references
	 * @param trackIds List of removed track ids
	 */
	async remove(trackIds: number[]) {
		this.logger.debug({ trackIds }, 'removing tracks')
		const albumChanges: Change[] = []
		const artistChanges: Change[] = []
		for (const {
			id: trackId,
			albumRef,
			artistRefs
		} of await tracksModel.removeByIds(trackIds)) {
			albumChanges.push(
				...(albumRef ? [albumRef] : []).map(ref => ({
					trackId,
					ref,
					removed: true as const
				}))
			)
			artistChanges.push(
				...(artistRefs ?? []).map(ref => ({
					trackId,
					ref,
					removed: true as const
				}))
			)
		}
		const albums = groupChangeByModel(albumChanges)
		if (albums.length) {
			this.logger.debug({ albums }, 'updating albums')
			await albumsModel.save(albums)
		}
		const artists = groupChangeByModel(artistChanges)
		if (artists.length) {
			this.logger.debug({ artists }, 'updating artists')
			await artistsModel.save(artists)
		}
	}
}

export const tracksService = new TracksService()

type Change =
	| {
			trackId: Track['id']
			agentId?: undefined
			media: undefined
			ref: Reference
			removed: true
	  }
	| {
			trackId: Track['id']
			agentId?: Track['agentId']
			media?: Track['media']
			ref: Reference
			removed?: boolean
	  }

function groupChangeByModel(changes: Change[]) {
	const modelById = new Map<
		number,
		PartialWithReq<Artist, 'id'> | PartialWithReq<Album, 'id'>
	>()
	for (const {
		trackId,
		ref: [id, name],
		agentId,
		media,
		removed
	} of changes) {
		let model = modelById.get(id)
		if (!model) {
			model = {
				id,
				name: name ?? undefined,
				media: name ? media : undefined,
				agentId: agentId,
				trackIds: [],
				removedTrackIds: []
			}
			modelById.set(id, model)
		}
		if (removed) {
			model?.removedTrackIds?.push(trackId)
		} else {
			model?.trackIds?.push(trackId)
		}
	}
	return [...modelById.values()]
}
