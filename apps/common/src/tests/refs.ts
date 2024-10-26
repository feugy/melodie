import type { Track } from '../models/tracks.ts'
import type { PartialWithReq } from '../types.ts'
import { hash } from '../utils/hash.ts'
import type { Reference } from '../utils/refs.ts'

export function addId<T extends { name?: string; path?: string }>(
	obj: T
): T & { id: number } {
	return { ...obj, id: hash(obj.name ?? obj.path ?? '') }
}

export function makeRef(value: string, usedValue?: string | number): Reference {
	return [hash(value), typeof usedValue === 'string' ? usedValue : value]
}

export function addRefs<T extends PartialWithReq<Track, 'tags'>>(track: T): T {
	return {
		...track,
		albumRef: track.tags.album ? makeRef(track.tags.album) : [1, null],
		artistRefs: track.tags.artists?.length
			? track.tags.artists.map(artist => makeRef(artist))
			: [[1, null]]
	}
}
