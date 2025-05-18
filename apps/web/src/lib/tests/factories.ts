import { faker } from '@faker-js/faker'
import type { Agent, Track } from '@melodie/common/models'
import { addRefs } from '@melodie/common/tests'

export function makeTrack(track: Partial<Track>) {
	const artist = faker.music.artist()
	const album = faker.music.album()
	return addRefs({
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
		agentId: null,
		...track
	}) as Track
}

export function makeAgentById() {
	const agent: Agent = { id: 1, name: 'default', base: '/' }
	return new Map([[agent.id, agent]])
}
