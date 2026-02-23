import type { Album, Track } from '@melodie/common/models'

export function sortByDiskAndNum(tracks?: Track[]) {
	return groupByDisk(tracks).flatMap(d => d.tracks)
}

export function groupByDisk(tracks?: Track[]) {
	if (!tracks) return []
	const disks: Array<Track[]> = []
	for (const track of tracks) {
		const diskNum = track.tags.disk?.no ?? 0
		disks[diskNum] ??= []
		disks[diskNum].push(track)
	}
	return [
		...disks
			.entries()
			.reduce<{ num: number; tracks: Track[] }[]>((result, [num, tracks]) => {
				if (tracks) {
					// biome-ignore lint/style/noNonNullAssertion: we checked above that tracks is defined.
					result.push({ num, tracks: sortByNum(tracks)! })
				}
				return result
			}, [])
	]
}

export function groupByAlbum(tracks?: Track[]) {
	if (!tracks) return []
	const map = new Map<Album['id'], { album: Album; tracks: Track[] }>()
	for (const track of tracks) {
		const { mtimeMs, agentId, media, mediaCount, albumRef } = track
		if (albumRef && albumRef[1] !== null) {
			const [id, name] = albumRef
			if (!map.has(id)) {
				map.set(id, {
					album: {
						id,
						name,
						media,
						mediaCount,
						refs: [],
						trackIds: [],
						agentId,
						mtimeMs
					},
					tracks: []
				})
			}
			// biome-ignore lint/style/noNonNullAssertion: the album has been added just above.
			map.get(id)!.tracks.push(track)
		}
	}
	const results: { album: Album; year: number; tracks: Track[] }[] = []
	for (const { album, tracks } of map.values()) {
		sortByNum(tracks)
		album.trackIds = tracks.map(t => t.id)
		results.push({ album, year: getYear(tracks), tracks })
	}
	return results.sort((a, b) => {
		return a.year - b.year
	})
}

export function getYear(tracks?: Track[]) {
	const year = (tracks ?? []).reduce(
		(min, { tags: { year } }) =>
			Math.min(min, year ?? Number.POSITIVE_INFINITY),
		Number.POSITIVE_INFINITY
	)
	return Number.isFinite(year) ? year : 0
}

export function sortByNum(tracks?: Track[]) {
	if (!tracks) return []
	return tracks.toSorted((a, b) => {
		const aNum = a.tags.track?.no ?? Number.POSITIVE_INFINITY
		const bNum = b.tags.track?.no ?? Number.POSITIVE_INFINITY
		return aNum - bNum
	})
}
