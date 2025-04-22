import { base } from '$app/paths'
import type { Track } from '@melodie/common/models'
import type { POSTGetTracksResponse } from '../../routes/api/get-tracks/+server'

export async function getTracksByIds(ids: number[]): Promise<Track[]> {
	if (ids.length === 0) return []
	const response = await fetch(`${base}/api/get-tracks`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ ids })
	})
	const { data } = (await response.json()) as POSTGetTracksResponse
	return data
}
