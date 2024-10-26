import type { Track } from '@melodie/common/models'
import { addId, makeRef } from '@melodie/common/tests/refs'
import cover from 'fixtures/cover.jpg'
import data from 'fixtures/file.webm'

const album = 'Diamonds on the inside'
const artists = ['Ben Harper']

export const trackData: Track = addId({
	agentId: 1,
	mtimeMs: 0,
	mediaCount: 1,
	path: '/file.webm',
	data,
	media: 'cover.jpg',
	cover,
	tags: {
		title: 'Mama got a girlfriend',
		artists,
		album,
		duration: 125.78,
		genre: []
	},
	albumRef: makeRef(album),
	artistRefs: artists.map(makeRef)
})

console.log(trackData)
