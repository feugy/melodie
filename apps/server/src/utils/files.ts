import { dirname, extname, join } from 'node:path'
import klaw from 'klaw'

/**
 * Computes full path (without extension) to a model's artwork file, according to ARTWORK_DESTINATION environment variable.
 * @param id Model's id.
 */
export function getArtworkFile(id: number) {
	return join(process.env.ARTWORK_DESTINATION ?? '', `${id}`)
}

export type Item = klaw.Item

/**
 * Creates an observable that walk all files within a given path, including nested folders
 * The emitted values are full paths
 * @param path Path to walk.
 */
export async function* walk(path: string) {
	const walker = klaw(path, { depthLimit: -1, preserveSymlinks: false })
	for await (const item of walker) {
		yield item
	}
}

/**
 * Excludes paths which are descendants of others
 * @param paths List of path to filter.
 */
export function excludeDescendants(paths: string[]) {
	// smallest paths first
	const sorted = paths.toSorted((a, b) => a.length - b.length)
	return sorted.reduce<string[]>((ancestors, folder) => {
		if (!ancestors.some(parent => folder.startsWith(parent))) {
			ancestors.push(folder)
		}
		return ancestors
	}, [])
}

/**
 * Extract unique paths to parent folders from a list of entries.
 * @param entries List of files/folders
 */
export function dirPaths(entries: string[]) {
	const unique = new Set()
	for (const entry of entries) {
		unique.add(extname(entry) ? dirname(entry) : entry)
	}
	return [...unique]
}
