import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { makeTrack } from '$lib/tests/factories'
import { init, tracksModel } from '@melodie/common/models'
import { cleanTestTB, initTestDB } from '@melodie/common/tests'
import type { DBConf } from '@melodie/common/types'
import { getTracksByIds } from './tracks'

describe('tracks server utils', () => {
	let conf: DBConf

	const tracks = Array.from({ length: 3 }, () => makeTrack())

	beforeAll(async () => {
		;({ conf } = await initTestDB())
		await init(conf)
		await tracksModel.save(tracks)
	})

	afterAll(async () => {
		await cleanTestTB(conf)
	})

	it('returns tracks by ids', async () => {
		expect(await getTracksByIds([tracks[0].id, tracks[1].id])).toEqual(
			tracks.slice(0, 2)
		)
	})

	it('omits unfound tracks', async () => {
		expect(await getTracksByIds([123456, tracks[0].id])).toEqual(
			tracks.slice(0, 1)
		)
	})

	it('keeps original order unfound tracks', async () => {
		expect(await getTracksByIds([tracks[2].id, tracks[1].id])).toEqual(
			tracks.slice(1, 3).reverse()
		)
	})
})
