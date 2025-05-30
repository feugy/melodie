import { describe, expect, it } from 'bun:test'
import {
	bindAlbum,
	makeAlbum,
	makeAlbums,
	makeTracks
} from '$lib/tests/factories'
import { faker } from '@faker-js/faker'
import { getYear, groupByAlbum, groupByDisk, sortByNum } from './tracks'

describe('tracks utilities', () => {
	describe('getYear()', () => {
		it('handles no tracks', () => {
			expect(getYear()).toBe(0)
		})

		it('handles tracks with no year', () => {
			expect(getYear(makeTracks(3))).toBe(0)
		})

		it('returns common year', () => {
			const year = faker.number.int({ min: 1960, max: 2025 })
			const tracks = makeTracks(4)
			tracks[0].tags.year = year
			tracks[1].tags.year = year
			tracks[2].tags.year = year
			tracks[3].tags.year = year
			expect(getYear(tracks)).toBe(year)
		})

		it('returns smallest year', () => {
			const year = faker.number.int({ min: 1960, max: 1980 })
			const year2 = faker.number.int({ min: year, max: 2025 })
			const tracks = makeTracks(5)
			tracks[0].tags.year = year
			tracks[1].tags.year = year
			tracks[2].tags.year = year2
			tracks[3].tags.year = year2
			tracks[4].tags.year = year
			expect(getYear(tracks)).toBe(year)
		})
	})

	describe('sortByNum()', () => {
		it('handles no tracks', () => {
			expect(sortByNum()).toEqual([])
		})

		it('sorts tracks by album number', () => {
			const tracks = makeTracks(4)
			tracks[0].tags.track = { no: 3, of: 4 }
			tracks[1].tags.track = { no: 1, of: 4 }
			tracks[2].tags.track = { no: 2, of: 4 }
			tracks[3].tags.track = { no: 4, of: 4 }
			expect(sortByNum(tracks)).toEqual([
				tracks[1],
				tracks[2],
				tracks[0],
				tracks[3]
			])
		})

		it('returns unnumbered tracks at the end', () => {
			const tracks = makeTracks(4)
			tracks[1].tags.track = { no: 1, of: 4 }
			tracks[3].tags.track = { no: 2, of: 4 }
			expect(sortByNum(tracks)).toEqual([
				tracks[1],
				tracks[3],
				tracks[0],
				tracks[2]
			])
		})
	})

	describe('groupByDisk()', () => {
		it('handles no tracks', () => {
			expect(groupByDisk()).toEqual([])
		})

		it('groups and sorts by disk', () => {
			const tracks = makeTracks(6)
			tracks[0].tags.disk = { no: 2, of: 2 }
			tracks[1].tags.disk = { no: 1, of: 2 }
			tracks[2].tags.disk = { no: 1, of: 2 }
			tracks[3].tags.disk = { no: 2, of: 2 }
			tracks[4].tags.disk = { no: 2, of: 2 }
			tracks[5].tags.disk = { no: 1, of: 2 }
			expect(groupByDisk(tracks)).toEqual([
				{ num: 1, tracks: [tracks[1], tracks[2], tracks[5]] },
				{ num: 2, tracks: [tracks[0], tracks[3], tracks[4]] }
			])
		})

		it('groups diskless tracks under num 0', () => {
			const tracks = makeTracks(6)
			tracks[0].tags.disk = { no: 2, of: 2 }
			tracks[1].tags.disk = { no: 1, of: 2 }
			tracks[2].tags.disk = { no: 1, of: 2 }
			tracks[5].tags.disk = { no: 1, of: 2 }
			expect(groupByDisk(tracks)).toEqual([
				{ num: 0, tracks: [tracks[3], tracks[4]] },
				{ num: 1, tracks: [tracks[1], tracks[2], tracks[5]] },
				{ num: 2, tracks: [tracks[0]] }
			])
		})

		it('sorts each disk', () => {
			const tracks = makeTracks(6)
			tracks[0].tags.disk = { no: 1, of: 3 }
			tracks[0].tags.track = { no: 3, of: 3 }
			tracks[1].tags.disk = { no: 1, of: 3 }
			tracks[1].tags.track = { no: 1, of: 3 }
			tracks[2].tags.disk = { no: 2, of: 3 }
			tracks[3].tags.disk = { no: 3, of: 4 }
			tracks[4].tags.disk = { no: 2, of: 3 }
			tracks[5].tags.disk = { no: 1, of: 3 }
			tracks[5].tags.track = { no: 2, of: 3 }
			expect(groupByDisk(tracks)).toEqual([
				{ num: 1, tracks: [tracks[1], tracks[5], tracks[0]] },
				{ num: 2, tracks: [tracks[2], tracks[4]] },
				{ num: 3, tracks: [tracks[3]] }
			])
		})
	})

	describe('groupByAlbum()', () => {
		const mtimeMs = faker.date.past().getTime()
		const agentId = faker.number.int()

		it('handles no tracks', () => {
			expect(groupByAlbum()).toEqual([])
		})

		it('groups by album and sorts by year', () => {
			const [album1, album2, album3] = makeAlbums(3, {
				agentId,
				mtimeMs,
				trackIds: []
			})
			const albumYear1 = 2020
			const albumYear2 = 1995
			const albumYear3 = 2007
			const tracks = makeTracks(6, { agentId, mtimeMs })
			bindAlbum(tracks[0], album2)
			tracks[0].tags.year = albumYear2
			bindAlbum(tracks[1], album1)
			tracks[1].tags.year = albumYear1
			bindAlbum(tracks[2], album1)
			tracks[2].tags.year = albumYear1
			bindAlbum(tracks[3], album2)
			tracks[3].tags.year = albumYear2
			bindAlbum(tracks[4], album3)
			tracks[4].tags.year = albumYear3
			bindAlbum(tracks[5], album1)
			tracks[5].tags.year = albumYear1

			expect(groupByAlbum(tracks)).toEqual([
				{ album: album2, year: albumYear2, tracks: [tracks[0], tracks[3]] },
				{ album: album3, year: albumYear3, tracks: [tracks[4]] },
				{
					album: album1,
					year: albumYear1,
					tracks: [tracks[1], tracks[2], tracks[5]]
				}
			])
		})

		it('handles tracks with no year', () => {
			const [album1, album2] = makeAlbums(2, {
				agentId,
				mtimeMs,
				trackIds: []
			})
			const year = 2020
			const tracks = makeTracks(6, { agentId, mtimeMs })
			bindAlbum(tracks[0], album2)
			tracks[0].tags.year = year
			bindAlbum(tracks[1], album1)
			bindAlbum(tracks[2], album1)
			bindAlbum(tracks[3], album2)
			tracks[3].tags.year = year
			bindAlbum(tracks[4], album2)
			tracks[4].tags.year = year
			bindAlbum(tracks[5], album1)

			expect(groupByAlbum(tracks)).toEqual([
				{
					album: album1,
					year: 0,
					tracks: [tracks[1], tracks[2], tracks[5]]
				},
				{ album: album2, year, tracks: [tracks[0], tracks[3], tracks[4]] }
			])
		})
	})
})
