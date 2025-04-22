import type { Stats } from 'node:fs'
import { mkdir, mkdtemp, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { faker } from '@faker-js/faker'

export async function makeFolder({
	folder = join(tmpdir(), 'melodie-'),
	fileNb = faker.number.int({ min: 2, max: 10 }),
	depth = 1
} = {}) {
	const files: { path: string; stats: Stats }[] = []
	folder = await mkdtemp(folder)
	const directFilesNb =
		depth === 1 ? fileNb : faker.number.int({ min: 1, max: fileNb - depth })
	for (const n of Array.from({ length: directFilesNb }, (v, i) => i)) {
		const path = join(
			folder,
			`${depth}-${n}.${faker.helpers.arrayElement(['mp3', 'ogg', 'flac'])}`
		)
		await mkdir(dirname(path), { recursive: true })
		await writeFile(path, '')
		files.push({ path, stats: await stat(path) })
	}
	if (depth > 1) {
		files.push(
			...(
				await makeFolder({
					folder: join(folder, 'folder-'),
					fileNb: fileNb - directFilesNb,
					depth: depth - 1
				})
			).files
		)
	}
	return { files, folder }
}

export async function makePlaylists({
	files,
	playlistNb = faker.number.int({ min: 2, max: 5 })
}: { files: { path: string; stats: Stats }[]; playlistNb?: number }) {
	const results = new Map<string, Stats>()
	for (let n = 0; n < playlistNb; n++) {
		const folder = dirname(faker.helpers.arrayElement(files).path)
		await mkdir(folder, { recursive: true })
		const path = join(
			folder,
			`${n}.${faker.helpers.arrayElement(['m3u', 'm3u8'])}`
		)
		await writeFile(path, '')
		results.set(path, await stat(path))
	}
	return results
}
