import { getTrackByIds } from '$lib/server'
import { parseRequest } from '$lib/utils'
import type { Track } from '@melodie/common/models'
import { json } from '@sveltejs/kit'
import { z } from 'zod'

export interface POSTGetTracksResponse {
	data: Track[]
	total: number
}

const bodySchema = z.object({
	ids: z.array(z.number())
})

export async function POST({ request }) {
	const {
		body: { ids }
	} = await parseRequest(request, { bodySchema })
	const data = await getTrackByIds(ids)
	return json({ data, total: data.length })
}
