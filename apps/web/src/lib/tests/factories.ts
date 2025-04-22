import { faker } from '@faker-js/faker'
import type { Track } from '@melodie/common/models'
import { hash } from '@melodie/common/utils'

export function makeTrack(track: Partial<Track>): Track {
	const artist = faker.music.artist()
	const album = faker.music.album()
	return {
		id: faker.number.int(),
		path: faker.system.filePath(),
		media: null,
		mediaCount: 0,
		mtimeMs: 0,
		tags: {
			album,
			artists: [artist],
			duration: 0,
			genre: [],
			title: faker.music.songName()
		},
		artistRefs: [[hash(artist), artist]],
		albumRef: [hash(album), album],
		agentId: null,
		...track
	}
}
