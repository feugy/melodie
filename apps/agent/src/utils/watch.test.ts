import { mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { type WatchEvent, watch } from './watch.ts'

describe('watch()', () => {
	let folder: string
	let controller: AbortController

	beforeEach(async () => {
		folder = join(await mkdtemp(join(tmpdir(), 'melodie-')))
		controller = new AbortController()
	})

	afterEach(() => {
		controller.abort()
	})

	it('detects file additions', async () => {
		const program = wrapWatcher(watch([folder], controller))
		const files = [
			join(folder, 'file1.txt'),
			join(folder, 'subfolder/file2.txt')
		]

		for (const file of files) {
			await setTimeout(10)
			await ensureFile(file)
		}

		await setTimeout(500)
		controller.abort()

		const { events, error } = await program
		expect(events).toEqual([
			{ kind: 'addition', path: files[0], stats: expect.any(Object) },
			{ kind: 'addition', path: files[1], stats: expect.any(Object) }
		])
		expect(error).toBeUndefined()
	})

	describe('given existing files', () => {
		let files: string[]

		beforeEach(async () => {
			files = [
				join(folder, 'a.txt'),
				join(folder, 'folder1/b.txt'),
				join(folder, 'folder1/c.txt')
			]
			for (const file of files) {
				await ensureFile(file)
			}
		})

		it('detects file and folder removals', async () => {
			const program = wrapWatcher(watch([folder], controller))

			await setTimeout(10)
			await rm(files[0])

			await setTimeout(10)
			await rm(dirname(files[1]), { recursive: true, force: true })

			await setTimeout(500)
			controller.abort()

			const { events, error } = await program
			expect(events).toEqual(
				expect.arrayContaining([
					{ kind: 'deletion', path: files[0] },
					{ kind: 'deletion', path: files[1] },
					{ kind: 'deletion', path: files[2] }
				])
			)
			expect(events).toHaveLength(3)
			expect(error).toBeUndefined()
		})

		it('detects file changes', async () => {
			const program = wrapWatcher(watch([folder], controller))
			await setTimeout(10)
			await writeFile(files[0], 'changed')

			await setTimeout(500)
			controller.abort()

			const { events, error } = await program
			expect(events).toEqual([
				{ kind: 'change', path: files[0], stats: expect.any(Object) }
			])
			expect(error).toBeUndefined()
		})

		it('detects renamed files', async () => {
			const program = wrapWatcher(watch([folder], controller))

			await setTimeout(10)
			const newFile = files[1].replace('b.txt', 'renamed.txt')
			await rename(files[1], newFile)

			await setTimeout(500)
			controller.abort()

			const { events, error } = await program
			expect(events).toEqual([
				{ kind: 'deletion', path: files[1] },
				{ kind: 'addition', path: newFile, stats: expect.any(Object) }
			])
			expect(error).toBeUndefined()
		})

		it('detects renamed folders', async () => {
			const program = wrapWatcher(watch([folder], controller))

			await setTimeout(10)
			const newFolder = dirname(files[1]).replace('folder1', 'renamed')
			await rename(dirname(files[1]), newFolder)

			await setTimeout(500)
			controller.abort()

			const { events, error } = await program
			expect(events).toEqual(
				expect.arrayContaining([
					{ kind: 'deletion', path: files[1] },
					{ kind: 'deletion', path: files[2] },
					{
						kind: 'addition',
						path: join(newFolder, 'b.txt'),
						stats: expect.any(Object)
					},
					{
						kind: 'addition',
						path: join(newFolder, 'c.txt'),
						stats: expect.any(Object)
					}
				])
			)
			expect(events).toHaveLength(4)
			expect(error).toBeUndefined()
		})
	})

	it('can watch several folders', async () => {
		const files = [
			join(folder, 'folder1/a.txt'),
			join(folder, 'folder2/b.txt'),
			join(folder, 'folder3/c.txt')
		]
		for (const file of files) {
			await ensureFile(file)
		}

		const program = wrapWatcher(watch(files.map(dirname), controller))

		await setTimeout(10)
		await rm(files[0])
		await setTimeout(10)
		await rename(files[1], files[1].replace('folder2', 'folder3'))

		await setTimeout(500)
		controller.abort()

		const { events, error } = await program
		expect(events).toEqual([
			{ kind: 'deletion', path: files[0] },
			{ kind: 'deletion', path: files[1] },
			{
				kind: 'addition',
				path: files[1].replace('folder2', 'folder3'),
				stats: expect.any(Object)
			}
		])
		expect(error).toBeUndefined()
	})

	it('does not watch subfolder twice', async () => {
		const files = [
			join(folder, 'a.txt'),
			join(folder, 'folder1/b.txt'),
			join(folder, 'folder1/c.txt')
		]
		for (const file of files) {
			await ensureFile(file)
		}

		const program = wrapWatcher(watch([folder, dirname(files[1])], controller))

		await setTimeout(10)
		await rm(files[1])
		await setTimeout(10)
		await rm(files[0])

		await setTimeout(500)
		controller.abort()

		const { events, error } = await program
		expect(events).toEqual([
			{ kind: 'deletion', path: files[1] },
			{ kind: 'deletion', path: files[0] }
		])
		expect(error).toBeUndefined()
	})
})

async function wrapWatcher(watcher: AsyncGenerator<WatchEvent>) {
	const result: { events: WatchEvent[]; error?: Error } = { events: [] }
	try {
		for await (const event of watcher) {
			result.events.push(event)
		}
	} catch (err) {
		result.error = err as Error
	}
	return result
}

async function ensureFile(path: string) {
	await mkdir(dirname(path), { recursive: true })
	await writeFile(path, '')
}
