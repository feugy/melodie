import { readFile, stat } from 'node:fs/promises'
import { basename, dirname, extname, isAbsolute, resolve } from 'node:path'
import {
	type Playlist,
	playlistsModel,
	tracksModel
} from '@melodie/common/models'
import type { PartialWithReq } from '@melodie/common/types'
import { difference } from '@melodie/common/utils'
import { type Logger, getLogger } from '@melodie/common/utils'
import { TagsService } from './tags.ts'

export class PlaylistsService {
	/** List of supported file formats*/
	static formats = ['.m3u', '.m3u8']

	toCheck: Playlist[] = []
	logger: Logger

	constructor() {
		this.toCheck = []
		this.logger = getLogger('services/playlists')
	}

	/**
	 * Detects whether a given path is a playlist file (.m3u).
	 * @param path - tested path
	 */
	isPlaylistFile(path: string) {
		return PlaylistsService.formats.includes(extname(path).toLowerCase())
	}

	/**
	 * Parses playlist files into Playlist models.
	 * Supported formats: m3u & m3u8.
	 * Handles:
	 * - absolute path to file
	 * - relative path to file (relative to the playlist file path)
	 * - file:// protocol
	 * - #PLAYLIST directive
	 * Web urls, nested folders and playlists are not supported.
	 *
	 * It assumes that track's id are hash of their path, which will not work for tracks that were moved.
	 * It is an acceptable caveat, given loading tracks by path is likely to fail during the first import
	 * of a folder, and given loading playlist makes most sense during this initial import.
	 * @param path - path of the file to parse
	 * @see https://en.wikipedia.org/wiki/M3U
	 */
	async read(path: string) {
		try {
			const lines = await readFile(
				path,
				extname(path) === '.m3u' ? 'latin1' : 'utf8'
			)
			const { ino, mtimeMs } = await stat(path)
			const playlist: Playlist & { trackPaths: string[] } = {
				id: ino,
				mtimeMs,
				name: basename(path).replace(/\.m3u.?$/, ''),
				trackIds: [0], // trackIds must not be empty or the playlist will not be saved.
				trackPaths: [],
				refs: [],
				mediaCount: 0
			}
			const root = dirname(path)
			for (const line of lines.split('\n')) {
				if (
					line.trim().length &&
					!line.startsWith('#') &&
					!line.startsWith('http')
				) {
					// decodes urls to absolute paths
					let path = line.startsWith('file://')
						? decodeURI(line).slice(7)
						: line
					if (!isAbsolute(path)) {
						// turns relative paths to absolute, based on playlist file containing folder
						path = resolve(root, path)
					}
					// m3u are likely to contains carriage return
					path = path.replace('\r', '')
					const ext = extname(path).toLowerCase()
					// ignores folders, nested playlists, and unsupported audio formats
					if (TagsService.formats.includes(ext)) {
						playlist.trackPaths.push(path)
					}
				} else if (line.startsWith('#PLAYLIST:')) {
					playlist.name = line.replace('#PLAYLIST:', '').trim()
				}
			}
			return playlist.trackPaths.length ? playlist : null
		} catch (error) {
			this.logger.warn({ error, path }, 'failed to read playlist')
			return null
		}
	}

	/**
	 * Saves a new or existing playlist to database. If the saved playlist has no track ids, it is removed.
	 * The passed track ids will override the ones already present (no merge).
	 * When the playlist is marked for check, its integrity will be validated during next `checkIntegrity()`.
	 * @param playlist Playlist to save.
	 * @param markForChecking Mark model for further validation.
	 */
	async save(
		playlist: PartialWithReq<Playlist, 'id'>,
		markForChecking = false
	) {
		this.logger.debug({ playlist, markForChecking }, 'save playlist')
		const { saved } = await playlistsModel.save(playlist)
		if (markForChecking) {
			this.toCheck.push(...saved)
		}
		return saved
	}

	/**
	 * For all playlist marked for checking, trimout all track ids that do not refer to actual tracks.
	 * Does nothing unless some playlist were marked for checking.
	 */
	async checkIntegrity() {
		for (const playlist of this.toCheck) {
			this.logger.debug(
				{ playlist: { ...playlist } },
				'checking playlist integrity'
			)
			// get ids of existing tracks
			const ids = (await tracksModel.getByIds(playlist.trackIds)).map(
				({ id }) => id
			)
			const trackIds = []
			for (const id of playlist.trackIds) {
				// filter original list to keep only the existing ids, with the same ordering
				if (ids.includes(id)) {
					trackIds.push(id)
				}
			}
			// resolve pending paths
			let resolveIds: number[] = []
			if (playlist.trackPaths?.length) {
				const tracks = await tracksModel.getByPaths(playlist.trackPaths)
				resolveIds = tracks.map(({ id }) => id)
			}
			this.logger.debug(
				{ playlist, trackIds, resolveIds },
				'resolved and valid ids'
			)
			// if we found differences, save the filtered ids
			if (resolveIds.length || difference(playlist.trackIds, trackIds).length) {
				const newTrackIds = [...trackIds, ...resolveIds]
				this.logger.info({ playlist, trackIds: newTrackIds }, 'fixing playlist')
				await this.save({
					...playlist,
					trackIds: newTrackIds,
					trackPaths: undefined
				})
			}
		}
		this.toCheck = []
	}
}

export const playlistsService = new PlaylistsService()
