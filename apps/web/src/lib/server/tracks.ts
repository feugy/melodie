import { type Track, tracksModel } from '@melodie/common/models'
import { database } from './database'

export async function getTrackByIds(ids: number[]) {
	await database.init()
	const tracks = await tracksModel.getByIds(ids)
	const response: Track[] = []
	for (const id of ids) {
		const track = tracks.find(track => track.id === id)
		if (track) {
			response.push(track)
		}
	}
	return response
}
