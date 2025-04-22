import { constants, access } from 'node:fs/promises'
import { dirname, extname, join } from 'node:path'
import { type Album, tracksModel } from '@melodie/common/models'
import { type Logger, getLogger } from '@melodie/common/utils'
import { mimeType } from 'mime-type/with-db'
import { walk } from '../utils/files.ts'

export interface Cover {
	/** Path to an image file */
	cover: string
	/** Provider name. */
	provider: string
}

const coverFiles = [
	'cover.jpg',
	'Cover.jpg',
	'cover.jpeg',
	'Cover.jpeg',
	'cover.png',
	'Cover.png',
	'cover.gif',
	'Cover.gif',
	'folder.jpg',
	'Folder.jpg',
	'folder.jpeg',
	'Folder.jpeg',
	'folder.png',
	'Folder.png',
	'folder.gif',
	'Folder.gif'
]

class CoversService {
	logger: Logger

	constructor() {
		this.logger = getLogger('services/covers')
	}

	/**
	 * Finds a cover image in a folder, by checkcking the existence of candidate files:
	 * - cover.{ext}
	 * - Cover.{ext}
	 * - folder.{ext}
	 * - Folder.{ext}
	 *
	 * possible extensions are: .jpeg, .jpg, .png, .gif (all lowercase)
	 * @param path Folder path on drive.
	 */
	async findInFolder(path: string) {
		// path could either be a folder or a file
		const folder = extname(path) ? dirname(path) : path
		for (const fileName of coverFiles) {
			const file = join(folder, fileName)
			try {
				await access(file, constants.R_OK)
				this.logger.debug({ file, path }, 'found cover')
				return file
			} catch {
				// ignore missing file
			}
		}
		this.logger.debug({ path }, 'no cover found')
		return null
	}

	/**
	 * Finds cover images for a given album:
	 * - uses the containing folder of the album first track
	 * - returns all images within it (jpeg/png/gif/bmp)
	 * @param album - album to search images for
	 */
	async findForAlbum(album: Album) {
		const firstTrack = await tracksModel.getById(album.trackIds[0])
		if (!firstTrack) return []
		const covers: Cover[] = []
		for await (const { path, stats } of walk(dirname(firstTrack.path))) {
			if (stats.isFile()) {
				const type = mimeType.lookup(extname(path))
				if (
					type === 'image/jpeg' ||
					type === 'image/gif' ||
					type === 'image/png' ||
					type === 'image/bmp'
				) {
					covers.push({ cover: path, provider: 'Local' })
				}
			}
		}
		this.logger.debug({ covers, album }, 'found album covers')
		return covers
	}
}

export const coversService = new CoversService()
