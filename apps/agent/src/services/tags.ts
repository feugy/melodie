import { basename, dirname } from 'node:path'
import { type Logger, getLogger } from '@melodie/common/utils'
import { type ICommonTagsResult, parseFile, selectCover } from 'music-metadata'

const titleRegex = /^(\d*)\s*[.-]?(?:([^-]+)-)?(.+)\.\w+$/i
const albumRegex = /^(?:\((\d*)\)\s+)?(.+)$/i

export interface Tags {
	title?: string
	album?: string
	albumartist?: string
	/** Main artist. */
	artist?: string
	/** All artists .*/
	artists: string[]
	genre: string[]
	/** Release year. */
	year?: number
	/** Duration in seconds. */
	duration: number
	/** Track position in album. */
	track?: { no?: number; of?: number }
	/** Track position in disk. */
	disk?: { no?: number; of?: number }
	/** Album's cover picture, when set. */
	cover?: { format: string; data: Uint8Array }
	[x: string]: unknown
}

export class TagsService {
	/** List of supported file formats. */
	static formats = ['.mp3', '.ogg', '.flac', '.webm', '.weba', '.opus', '.wav']

	logger: Logger

	constructor() {
		this.logger = getLogger('services/tags')
	}

	/**
	 * Reads music metadata from file.
	 * _Note_: pictures are intentionally removed, but cover is returned when present, as an IPicture object
	 * @param path Path of the file to parse
	 */
	async read(path: string) {
		// TODO discs
		const tags: Tags = {
			artists: [],
			genre: [],
			duration: 0
		}
		try {
			const { common, format } = await parseFile(path)
			purgeEmpty(common)
			tags.duration = format.duration ?? 0
			if (!tags.duration) {
				tags.duration =
					(await parseFile(path, { duration: true })).format.duration ?? 0
			}
			tags.cover = selectCover(common.picture) ?? undefined
			// don't returns embedded pictures
			Object.assign(tags, common, { picture: undefined })
		} catch (error) {
			this.logger.warn({ error, path }, 'failed to read tags')
		}
		if (!tags.title || !tags.artist) {
			const match = titleRegex.exec(basename(path))
			if (match) {
				const [, num, artist, title] = match
				tags.title = tags.title ?? title?.trim()
				tags.artist = tags.artist ?? artist?.trim()
				if (tags.artist && !tags.artists.includes(tags.artist)) {
					tags.artists.push(tags.artist)
				}
				if (!(tags as unknown as ICommonTagsResult).track?.no && !!num) {
					tags.track = {
						no: Number.parseInt(num),
						of: tags?.track?.of
					}
				}
			}
		}
		if (!tags.album || !tags.year) {
			const match = albumRegex.exec(basename(dirname(path)))
			if (match) {
				const [, year, album] = match
				tags.album = tags.album ?? album?.trim()
				if (!tags.year && !!year) {
					tags.year = Number.parseInt(year)
				}
			}
		}
		this.logger.debug(
			{ path, tags: { ...tags, cover: tags.cover ? 'with data' : undefined } },
			'tags found'
		)
		return tags
	}
}

export const tagsService = new TagsService()

function purgeEmpty(tags: ICommonTagsResult) {
	for (const property of ['track', 'movementIndex', 'disk'] as const) {
		const value = tags[property]
		if (typeof value === 'object') {
			if (!value.no && !value.of) {
				// @ts-expect-error -- delete is too slow
				tags[property] = undefined
			} else {
				if (value.no === null) {
					// @ts-expect-error -- delete is too slow
					tags[property].no = undefined
				}
				if (value.of === null) {
					// @ts-expect-error -- delete is too slow
					tags[property].of = undefined
				}
			}
		}
	}
}
