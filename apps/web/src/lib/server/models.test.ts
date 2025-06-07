import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { makeAlbums, makeArtists, makeTracks } from '$lib/tests/factories'
import { faker } from '@faker-js/faker'
import type { Album, Artist } from '@melodie/common/models'
import {
	albumsModel,
	artistsModel,
	init,
	tracksModel
} from '@melodie/common/models'
import { cleanTestTB, initTestDB } from '@melodie/common/tests'
import type { DBConf } from '@melodie/common/types'
import { count, list, loadTracks } from './models'

describe('models server utils', () => {
	let conf: DBConf

	const artists = makeArtists(3)
	const albums = makeAlbums(3)
	const tracks = makeTracks(10)
	albums[0].trackIds = tracks.slice(0, 3).map(({ id }) => id)
	artists[0].trackIds = tracks.slice(2, 5).map(({ id }) => id)

	beforeAll(async () => {
		;({ conf } = await initTestDB())
		await init(conf)
		await artistsModel.save(artists)
		await albumsModel.save(albums)
		await tracksModel.save(tracks)
	})

	afterAll(async () => {
		await cleanTestTB(conf)
	})

	async function consume<T>(generator: AsyncGenerator<T>) {
		const result: T[] = []
		for await (const item of generator) {
			result.push(item)
		}
		return result
	}

	it('returns artists', async () => {
		expect(await consume(list('artists'))).toEqual(artists)
	})

	it('counts artists', async () => {
		expect(await count('artists')).toEqual(artists.length)
	})

	it('returns artists from multiple pages', async () => {
		expect(await consume(list('artists', 1))).toEqual(artists)
	})

	it('returns albums', async () => {
		expect(await consume(list('albums'))).toEqual(albums)
	})

	it('counts albums', async () => {
		expect(await count('albums')).toEqual(albums.length)
	})

	it('returns albums from multiple pages', async () => {
		expect(await consume(list('albums', 1))).toEqual(albums)
	})

	it('loads album tracks', async () => {
		expect(await loadTracks(albums[0])).toEqual(tracks.slice(0, 3))
	})

	it('loads artist tracks', async () => {
		expect(await loadTracks(artists[0])).toEqual(tracks.slice(2, 5))
	})
})
