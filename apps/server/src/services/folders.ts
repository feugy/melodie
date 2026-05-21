import { stat, writeFile } from 'node:fs/promises'
import { dirname, extname, resolve } from 'node:path'
import {
	type Track,
	agentsModel,
	playlistsModel,
	tracksModel
} from '@melodie/common/models'
import { type Logger, getLogger } from '@melodie/common/utils'
import { mimeType } from 'mime-type/with-db'
import ms from 'ms'
import { type Item, excludeDescendants, walk } from '../utils/files.ts'
import { raceConcurrently } from '../utils/promises.ts'
import { coversService } from './covers.ts'
import { PlaylistsService, playlistsService } from './playlists.ts'
import { TagsService, tagsService } from './tags.ts'
import { tracksService } from './tracks.ts'

const extensions = [...TagsService.formats, ...PlaylistsService.formats]

export class FoldersService {
	logger: Logger

	/** Number of concurrent worker when comparing folders. */
	compareConcurrency: number

	/** Number of tracks buffered before saving. */
	bufferSize: number

	/** Buffer of saved tracks. */
	protected _savedBuffer: Track[]
	protected _savedIdx: number
	/** Buffer of removed tracks. */
	protected _removedBuffer: number[]
	protected _removedIdx: number

	constructor({
		compareConcurrency = 2,
		bufferSize = 200
	}: {
		compareConcurrency?: number
		bufferSize?: number
	} = {}) {
		this.logger = getLogger('services/folders')
		this.compareConcurrency = compareConcurrency
		this.bufferSize = bufferSize
		this._savedBuffer = Array(this.bufferSize)
		this._savedIdx = 0
		this._removedBuffer = Array(this.bufferSize)
		this._removedIdx = 0
	}

	/**
	 * Walks the provided folders and collect file paths and modification times from the drive.
	 * Registers an agent in database, and all subsequent data will be bound to that agent.
	 * @param comparedFolders Folders to compare.
	 * @param base Base URL for the registered agent.
	 * @returns the list of compared folders, without duplicates nor descendants.
	 */
	async compare(comparedFolders: string[], base: string): Promise<string[]> {
		const folders = excludeDescendants(comparedFolders)
		if (folders.length === 0) {
			throw new Error('no folder to watch')
		}

		const agentId = (await stat(folders[0])).ino
		await agentsModel.save({ id: agentId, name: 'local', base })
		this.logger.info('assiging agent Id', { folders: folders, agentId })

		const startMs = Date.now()
		this.logger.info('comparing folders...', { folders })
		let error: Error | undefined
		try {
			const tracksIds = await tracksModel.listWithTime()
			const playlistIds = await playlistsModel.listWithTime()
			const mtimeMsByIno = new Map([...tracksIds, ...playlistIds])

			const results = await raceConcurrently(
				folders.map(
					folder => () => this._walk({ folder, mtimeMsByIno, agentId })
				),
				this.compareConcurrency
			)
			const errors = results.reduce<Error[]>((errors, result) => {
				if (result.status === 'rejected') {
					errors.push(result.reason)
				}
				return errors
			}, [])
			if (errors.length) {
				throw errors[0]
			}

			const removedIds: number[] = []
			for (const ino of mtimeMsByIno.keys()) {
				if (!playlistIds.has(ino)) {
					// we don't remove playlists
					removedIds.push(ino)
				}
			}
			if (removedIds.length) {
				this.logger.debug(`removing ${removedIds.length} tracks`, {
					removedIds
				})
				await tracksService.remove(removedIds)
			}
			await playlistsService.checkIntegrity()
		} catch (err) {
			error = err as Error
			throw error
		} finally {
			const duration = Date.now() - startMs
			this.logger[error ? 'error' : 'info'](
				`folder compared in ${ms(duration)}`,
				{ folders, duration, error }
			)
		}
		return folders
	}

	protected async _walk({
		folder,
		agentId,
		mtimeMsByIno
	}: {
		folder: string
		agentId: number
		mtimeMsByIno: Map<number, number>
	}) {
		function isNewFile({ path, stats: { ino, mtimeMs } }: Item) {
			const knownTime = mtimeMsByIno.get(ino)
			mtimeMsByIno.delete(ino)
			return (
				!knownTime ||
				(!playlistsService.isPlaylistFile(path) && knownTime < mtimeMs)
			)
		}
		try {
			for await (const entry of walk(folder)) {
				const ext = extname(entry.path).toLowerCase()
				if (
					entry.stats.isFile() &&
					extensions.includes(ext) &&
					isNewFile(entry)
				) {
					await this._processEntry(entry, agentId)
				}
			}
		} finally {
			await this._flush()
		}
	}

	protected async _flush() {
		if (this._savedIdx) {
			const saved = this._savedBuffer.slice(0, this._savedIdx)
			this._savedBuffer = Array(this.bufferSize)
			this._savedIdx = 0
			this.logger.debug(`saving ${saved.length} tracks`, {
				savedId: saved.map(({ id }) => id)
			})
			await tracksService.add(saved)
		}
		if (this._removedIdx) {
			const removedIds = this._removedBuffer.slice(0, this._removedIdx)
			this._removedBuffer = Array(this.bufferSize)
			this._removedIdx = 0
			this.logger.debug(`removing ${removedIds.length} tracks`, { removedIds })
			await tracksService.remove(removedIds)
			await playlistsService.checkIntegrity()
		}
	}

	protected async _processEntry(
		{ path, stats: { mtimeMs, ino } }: Item,
		agentId: number
	) {
		if (playlistsService.isPlaylistFile(path)) {
			const playlist = await playlistsService.read(path)
			if (playlist) {
				this.logger.debug('saving 1 playlist', { playlist })
				await playlistsService.save(playlist, true)
				return true
			}
		} else {
			const saved: Track = {
				agentId: agentId,
				id: ino,
				mtimeMs,
				path,
				tags: await tagsService.read(path),
				media: await coversService.findInFolder(path),
				mediaCount: 0,
				artistRefs: [],
				albumRef: null
			}
			this._savedBuffer[this._savedIdx++] = await this._extractCover(saved)
			this.logger.debug('enqueue 1 track change', { id: saved.id, path })
			if (this._savedIdx === this.bufferSize) {
				await this._flush()
			}
		}
		return false
	}

	protected async _extractCover(track: Track) {
		const cover = track.tags.cover
		// do not keep cover in tags
		track.tags.cover = undefined
		if (!track.media && cover) {
			// save cover from tags as album cover unless we already have media
			const { format, data } = cover
			try {
				const media = resolve(
					dirname(track.path),
					`cover.${mimeType.extension(format)}`
				)
				await writeFile(media, data)
			} catch (err) {
				this.logger.error(
					`failed to save cover from track's tags as album cover: ${(err as Error).message}`,
					{ track, err }
				)
			}
		}
		return track
	}
}

export const foldersService = new FoldersService()
