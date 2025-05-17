import { readFile, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, extname, resolve } from 'node:path'
import { isNativeError } from 'node:util/types'
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
import { watch } from '../utils/watch.ts'
import { coversService } from './covers.ts'
import { PlaylistsService, playlistsService } from './playlists.ts'
import { TagsService, tagsService } from './tags.ts'
import { tracksService } from './tracks.ts'

const extensions = [...TagsService.formats, ...PlaylistsService.formats]

export class FoldersService {
	logger: Logger
	/** Used to cancel the watcher background job */
	abortController: AbortController

	/** Number of concurrent worker when comparing folders. */
	compareConcurrency: number

	/** Number of tracks buffered before saving. */
	bufferSize: number

	/** Time (in ms) during whitch watched changed are buffered. */
	watchDelayMs: number

	/** Watched folders. */
	protected _folders: string[]

	/** Current agent id. */
	protected _agentId: number

	/** Buffer of saved tracks. */
	protected _savedBuffer: Track[]
	protected _savedIdx: number
	/** Buffer of removed tracks. */
	protected _removedBuffer: number[]
	protected _removedIdx: number

	constructor({
		compareConcurrency = 2,
		bufferSize = 200,
		watchDelayMs = 250
	}: {
		compareConcurrency?: number
		bufferSize?: number
		watchDelayMs?: number
	} = {}) {
		this.logger = getLogger('services/folders')
		this.abortController = new AbortController()
		this.compareConcurrency = compareConcurrency
		this.bufferSize = bufferSize
		this.watchDelayMs = watchDelayMs
		this._savedBuffer = Array(this.bufferSize)
		this._savedIdx = 0
		this._removedBuffer = Array(this.bufferSize)
		this._removedIdx = 0
		this._folders = []
		this._agentId = 0
	}

	get agentId() {
		return this._agentId
	}

	get folders() {
		return this._folders
	}

	/** Stops watching folders, if watching. */
	async stopWatching() {
		this.logger.info({ folders: this.folders }, 'stops watching folders')
		this.abortController.abort()
		this.abortController = new AbortController()
	}

	/**
	 * Watches and compare a list of folder, that is walks provided folders and collect file paths and modification times from the drive.
	 * Registers an agent in database, and all subsequent data will be bound to that agent.
	 * While watching, changes and removal on tracked playlist are ignored.
	 * @param folders Folders to watch and compare.
	 * @param base Base URL for the registered agent.
	 */
	async watchAndCompare(folders: string[], base: string) {
		await this.stopWatching()
		this._folders = excludeDescendants(folders)
		if (this.folders.length === 0) {
			throw new Error('no folder to watch')
		}

		this._agentId = (await stat(this.folders[0])).ino
		await agentsModel.save({ id: this.agentId, name: 'local', base })
		this.logger.info(
			{ folders: this.folders, agentId: this.agentId },
			'assiging agent Id'
		)
		this._startWatching(this.folders)
		await this._compare(this.folders)
	}

	protected async _compare(folders: string[]) {
		const startMs = Date.now()
		this.logger.info({ folders }, 'comparing folders...')
		let error: Error | undefined
		try {
			const tracksIds = await tracksModel.listWithTime()
			const playlistIds = await playlistsModel.listWithTime()
			const mtimeMsByIno = new Map([...tracksIds, ...playlistIds])

			const results = await raceConcurrently(
				folders.map(folder => () => this._walk({ folder, mtimeMsByIno })),
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
				this.logger.debug(
					{ removedIds },
					`removing ${removedIds.length} tracks`
				)
				await tracksService.remove(removedIds)
			}
			await playlistsService.checkIntegrity()
		} catch (err) {
			error = err as Error
			throw error
		} finally {
			const duration = Date.now() - startMs
			this.logger[error ? 'error' : 'info'](
				{ folders, duration, error },
				`folder compared in ${ms(duration)}`
			)
		}
	}

	protected async _walk({
		folder,
		mtimeMsByIno
	}: {
		folder: string
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
					await this._processEntry(entry)
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
			this.logger.debug(
				{ savedId: saved.map(({ id }) => id) },
				`saving ${saved.length} tracks`
			)
			await tracksService.add(saved)
		}
		if (this._removedIdx) {
			const removedIds = this._removedBuffer.slice(0, this._removedIdx)
			this._removedBuffer = Array(this.bufferSize)
			this._removedIdx = 0
			this.logger.debug({ removedIds }, `removing ${removedIds.length} tracks`)
			await tracksService.remove(removedIds)
			await playlistsService.checkIntegrity()
		}
	}

	protected async _processEntry({ path, stats: { mtimeMs, ino } }: Item) {
		if (playlistsService.isPlaylistFile(path)) {
			const playlist = await playlistsService.read(path)
			if (playlist) {
				this.logger.debug({ playlist }, 'saving 1 playlist')
				await playlistsService.save(playlist, true)
				return true
			}
		} else {
			const saved: Track = {
				agentId: this.agentId,
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
			this.logger.debug({ id: saved.id, path }, 'enqueue 1 track change')
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
					{ track, err },
					`failed to save cover from track's tags as album cover: ${(err as Error).message}`
				)
			}
		}
		return track
	}

	protected async _startWatching(folders: string[]) {
		this.logger.info({ folders, extensions }, 'watching folders...')

		let timeout: NodeJS.Timeout | undefined
		let changes: (Item | Track)[] = []

		const process = async () => {
			const copy = [...changes]
			changes = []
			let checkNeeded = false
			for (const change of this._dedupeChanges(copy)) {
				if ('id' in change) {
					// we don't remove playlists
					this._removedBuffer[this._removedIdx++] = change.id
					this.logger.debug(
						{ id: change.id, path: change.path },
						'enqueue 1 track deletion'
					)
				} else {
					checkNeeded = checkNeeded || (await this._processEntry(change))
				}
			}
			await this._flush()
			if (checkNeeded) {
				await playlistsService.checkIntegrity()
			}
		}

		for await (const event of watch(folders, this.abortController)) {
			if (event.kind === 'error') {
				this.logger.error({ error: event.error }, 'received watch error')
				continue
			}
			let change: Item | Track | undefined
			if (event.kind === 'deletion') {
				const tracks = await tracksModel.getByPaths([event.path])
				if (tracks.length) {
					change = tracks[0]
				}
			} else if (
				event.stats.isFile() &&
				extensions.includes(extname(event.path).toLowerCase())
			) {
				if (playlistsService.isPlaylistFile(event.path)) {
					if (null === (await playlistsModel.getById(event.stats.ino))) {
						// only consider addition of new playlists
						change = event
					}
				} else {
					// consider changes and addition of tracks
					change = event
				}
			}
			// ignore additions and changes on non-supported files, or deletion of untracked files
			if (!change) continue
			this.logger.debug(
				'id' in change
					? { id: change.id, path: change.path }
					: { kind: event.kind, path: event.path },
				`${event.kind} recorded`
			)
			changes.push(change)

			clearTimeout(timeout)
			timeout = setTimeout(process, this.watchDelayMs)
		}
	}

	protected _dedupeChanges(changes: (Item | Track)[]) {
		const lastChangeByIno = new Map<number, Item | Track>()
		for (const change of changes) {
			const isRemoval = 'id' in change
			const id = isRemoval ? change.id : change.stats.ino
			const last = lastChangeByIno.get(id)
			if (last) {
				// in case we already have an event for this inode, only keeps the addition one
				const [addition, removal] = isRemoval ? [last, change] : [change, last]
				lastChangeByIno.set(id, addition)
				this.logger.debug(
					{ oldPath: removal.path, newPath: addition.path },
					'file renamed'
				)
			} else if (!isRemoval) {
				lastChangeByIno.set(change.stats.ino, change)
			} else if (!playlistsService.isPlaylistFile(change.path)) {
				// we add and remove tracks, but we only add playlists
				lastChangeByIno.set(change.id, change)
			}
		}
		return lastChangeByIno.values()
	}
}

export const foldersService = new FoldersService()
