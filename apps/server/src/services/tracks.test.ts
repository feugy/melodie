import { beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { setTimeout } from 'node:timers/promises'
import { faker } from '@faker-js/faker'
import type { Album, Artist, Track } from '@melodie/common/models'
import { albumsModel, artistsModel, tracksModel } from '@melodie/common/models'
import { addId, addRefs } from '@melodie/common/tests'
import type { PartialWithReq } from '@melodie/common/types'
import { hash } from '@melodie/common/utils'
import { tracksService as service } from './tracks.ts'

describe('Tracks service', () => {
	const agentId = faker.number.int()

	const albumsSave = spyOn(albumsModel, 'save')
	const artistsSave = spyOn(artistsModel, 'save')
	const tracksSave = spyOn(tracksModel, 'save')
	const tracksRemoveByIds = spyOn(tracksModel, 'removeByIds')

	beforeEach(() => {
		albumsSave.mockClear().mockResolvedValue({ saved: [], removedIds: [] })
		artistsSave.mockClear().mockResolvedValue({ saved: [], removedIds: [] })
		tracksSave.mockClear().mockResolvedValue([])
		tracksRemoveByIds.mockClear()
	})

	describe('add()', () => {
		it('stores track with multiple artists', async () => {
			const path = faker.system.fileName()
			const artistNames = [faker.music.artist(), faker.music.artist()]
			const tracks: Track[] = [
				{
					path,
					tags: { artists: artistNames, genre: [], duration: 0 },
					mtimeMs: 0,
					media: null,
					mediaCount: 0,
					artistRefs: [],
					albumRef: null,
					agentId
				}
			].map(addId)
			const savedArtists: Partial<Artist>[] = artistNames.map(name =>
				addId({
					name,
					trackIds: [hash(path)],
					agentId,
					removedTrackIds: [],
					media: null
				})
			)
			const unknownAlbum: Partial<Album> = {
				id: 1,
				agentId,
				trackIds: tracks.map(({ id }) => id),
				removedTrackIds: []
			}
			spyOn(tracksModel, 'save').mockResolvedValue(
				tracks.map(addRefs).map(current => ({ current, previous: null }))
			)
			artistsSave.mockResolvedValueOnce({
				saved: savedArtists as Artist[],
				removedIds: []
			})
			albumsSave.mockResolvedValueOnce({
				saved: [unknownAlbum as Album],
				removedIds: []
			})

			await service.add(tracks)

			expect(spyOn(tracksModel, 'save')).toHaveBeenCalledWith(tracks)
			expect(spyOn(tracksModel, 'save')).toHaveBeenCalledTimes(1)
			expect(artistsSave).toHaveBeenCalledWith(savedArtists)
			expect(artistsSave).toHaveBeenCalledTimes(1)
			expect(albumsSave).toHaveBeenCalledWith([unknownAlbum])
			expect(albumsSave).toHaveBeenCalledTimes(1)
		})

		it('stores track with album', async () => {
			const name = faker.music.album()
			const path = faker.system.fileName()
			const tracks: Track[] = [
				{
					mtimeMs: 0,
					path,
					tags: { album: name, artists: [], genre: [], duration: 0 },
					media: null,
					mediaCount: 0,
					artistRefs: [],
					albumRef: null,
					agentId
				}
			].map(addId)
			spyOn(tracksModel, 'save').mockResolvedValue(
				tracks.map(addRefs).map(current => ({ current, previous: null }))
			)
			const unknownArtist: Partial<Artist> = {
				id: 1,
				agentId,
				trackIds: tracks.map(({ id }) => id),
				removedTrackIds: []
			}
			const savedAlbum: Partial<Album> = addId({
				name,
				agentId,
				trackIds: [hash(path)],
				removedTrackIds: [],
				media: null
			})
			albumsSave.mockResolvedValueOnce({
				saved: [savedAlbum as Album],
				removedIds: []
			})
			artistsSave.mockResolvedValueOnce({
				saved: [unknownArtist as Artist],
				removedIds: []
			})

			await service.add(tracks)

			expect(spyOn(tracksModel, 'save')).toHaveBeenCalledWith(tracks)
			expect(spyOn(tracksModel, 'save')).toHaveBeenCalledTimes(1)
			expect(albumsSave).toHaveBeenCalledWith([savedAlbum])
			expect(albumsSave).toHaveBeenCalledTimes(1)
			expect(artistsSave).toHaveBeenCalledWith([unknownArtist])
			expect(artistsSave).toHaveBeenCalledTimes(1)
		})

		it('stores track with cover', async () => {
			const name = faker.music.album()
			const media = faker.image.url()
			const path = faker.system.fileName()
			const savedAlbum: Partial<Album> = addId({
				name,
				agentId,
				media,
				trackIds: [hash(path)],
				removedTrackIds: []
			})
			const tracks: Track[] = [
				{
					path,
					mtimeMs: 0,
					tags: { album: name, artists: [], genre: [], duration: 0 },
					media,
					mediaCount: 0,
					artistRefs: [],
					albumRef: null,
					agentId
				}
			].map(addId)
			const unknownArtist: Partial<Artist> = {
				id: 1,
				agentId,
				trackIds: tracks.map(({ id }) => id),
				removedTrackIds: []
			}
			const savedTracks = tracks.map(addRefs)
			spyOn(tracksModel, 'save').mockResolvedValue(
				savedTracks.map(current => ({ current, previous: null }))
			)
			albumsSave.mockResolvedValueOnce({
				saved: [savedAlbum as Album],
				removedIds: []
			})
			artistsSave.mockResolvedValueOnce({
				saved: [unknownArtist as Artist],
				removedIds: []
			})

			await service.add(tracks)

			expect(spyOn(tracksModel, 'save')).toHaveBeenCalledWith(tracks)
			expect(spyOn(tracksModel, 'save')).toHaveBeenCalledTimes(1)
			expect(albumsSave).toHaveBeenCalledWith([savedAlbum])
			expect(albumsSave).toHaveBeenCalledTimes(1)
		})

		it('skips existing albums', async () => {
			const name = faker.music.album()
			const artist1 = faker.music.artist()
			const artist2 = faker.music.artist()
			const track1 = addId({
				path: faker.system.fileName(),
				mtimeMs: 0,
				tags: { album: name, artists: [artist1], genre: [], duration: 0 },
				media: null,
				mediaCount: 0,
				artistRefs: [],
				albumRef: null,
				agentId
			})
			const track2 = addId({
				path: faker.system.fileName(),
				mtimeMs: 0,
				tags: { album: name, artists: [artist2], genre: [], duration: 0 },
				media: null,
				mediaCount: 0,
				artistRefs: [],
				albumRef: null,
				agentId
			})
			const track3 = addId({
				path: faker.system.fileName(),
				mtimeMs: 0,
				tags: { album: name, artists: [artist2], genre: [], duration: 0 },
				media: null,
				mediaCount: 0,
				artistRefs: [],
				albumRef: null,
				agentId
			})

			const tracks: Track[] = [track1, track2, track3]
			const savedAlbum: Partial<Album> = addId({
				name,
				agentId,
				trackIds: tracks.map(({ id }) => id),
				removedTrackIds: [],
				media: null
			})
			const savedArtists: Partial<Artist>[] = [
				{
					name: artist1,
					agentId,
					trackIds: [track1.id],
					removedTrackIds: [],
					media: null
				},
				{
					name: artist2,
					agentId,
					trackIds: [track2.id, track3.id],
					removedTrackIds: [],
					media: null
				}
			].map(addId)
			const savedTracks = tracks.map(addRefs)
			spyOn(tracksModel, 'save').mockResolvedValue(
				savedTracks.map(current => ({ current, previous: null }))
			)
			albumsSave.mockResolvedValueOnce({
				saved: [savedAlbum as Album],
				removedIds: []
			})
			artistsSave.mockResolvedValueOnce({
				saved: savedArtists as Artist[],
				removedIds: []
			})

			await service.add(tracks)

			expect(spyOn(tracksModel, 'save')).toHaveBeenCalledWith(tracks)
			expect(spyOn(tracksModel, 'save')).toHaveBeenCalledTimes(1)
			expect(albumsSave).toHaveBeenCalledWith([savedAlbum])
			expect(albumsSave).toHaveBeenCalledTimes(1)
			expect(artistsSave).toHaveBeenCalledWith(savedArtists)
			expect(artistsSave).toHaveBeenCalledTimes(1)
		})

		it('skips existing artists', async () => {
			const artist1 = faker.system.filePath()
			const artist2 = faker.system.filePath()
			const artist3 = faker.system.filePath()
			const track1: Track = addId({
				path: faker.system.fileName(),
				mtimeMs: 0,
				tags: { artists: [artist1, artist2], genre: [], duration: 0 },
				media: null,
				mediaCount: 0,
				artistRefs: [],
				albumRef: null,
				agentId
			})
			const track2: Track = addId({
				path: faker.system.fileName(),
				mtimeMs: 0,
				tags: { artists: [artist2, artist3], genre: [], duration: 0 },
				media: null,
				mediaCount: 0,
				artistRefs: [],
				albumRef: null,
				agentId
			})
			const track3: Track = addId({
				path: faker.system.fileName(),
				mtimeMs: 0,
				tags: { artists: [artist3], genre: [], duration: 0 },
				media: null,
				mediaCount: 0,
				artistRefs: [],
				albumRef: null,
				agentId
			})

			const savedArtists: Partial<Artist>[] = [
				{
					name: artist1,
					agentId,
					trackIds: [track1.id],
					removedTrackIds: [],
					media: null
				},
				{
					name: artist2,
					agentId,
					trackIds: [track1.id, track2.id],
					removedTrackIds: [],
					media: null
				},
				{
					name: artist3,
					agentId,
					trackIds: [track2.id, track3.id],
					removedTrackIds: [],
					media: null
				}
			].map(addId)
			const tracks = [track1, track2, track3]
			const savedTracks = tracks.map(addRefs)
			const unknownAlbum: Partial<Album> = {
				id: 1,
				agentId,
				trackIds: tracks.map(({ id }) => id),
				removedTrackIds: []
			}
			spyOn(tracksModel, 'save').mockResolvedValue(
				savedTracks.map(current => ({ current, previous: null }))
			)
			artistsSave.mockResolvedValueOnce({
				saved: savedArtists as Artist[],
				removedIds: []
			})
			albumsSave.mockResolvedValueOnce({
				saved: [unknownAlbum as Album],
				removedIds: []
			})

			await service.add(tracks)

			expect(spyOn(tracksModel, 'save')).toHaveBeenCalledWith(tracks)
			expect(spyOn(tracksModel, 'save')).toHaveBeenCalledTimes(1)
			expect(artistsSave).toHaveBeenCalledWith(savedArtists)
			expect(artistsSave).toHaveBeenCalledTimes(1)
			expect(albumsSave).toHaveBeenCalledWith([unknownAlbum])
			expect(albumsSave).toHaveBeenCalledTimes(1)
		})

		it('detects album changes for existing tracks', async () => {
			const oldName = faker.music.songName()
			const updatedName = faker.music.songName()
			const newName = faker.music.songName()
			const artist1 = faker.system.filePath()
			const artist2 = faker.system.filePath()
			const artist3 = faker.system.filePath()

			const track1 = addId({
				path: faker.system.fileName(),
				mtimeMs: 0,
				tags: { album: newName, artists: [artist2], genre: [], duration: 0 },
				media: null,
				mediaCount: 0,
				artistRefs: [],
				albumRef: null,
				agentId
			})
			const track2 = addId({
				path: faker.system.fileName(),
				mtimeMs: 0,
				tags: { album: newName, artists: [artist1], genre: [], duration: 0 },
				media: null,
				mediaCount: 0,
				artistRefs: [],
				albumRef: null,
				agentId
			})
			const track3 = addId({
				path: faker.system.fileName(),
				mtimeMs: 0,
				tags: {
					album: newName,
					artists: [artist1, artist2],
					genre: [],
					duration: 0
				},
				media: null,
				mediaCount: 0,
				artistRefs: [],
				albumRef: null,
				agentId
			})
			const track4 = addId({
				path: faker.system.fileName(),
				mtimeMs: 0,
				tags: {
					album: updatedName,
					artists: [artist3],
					genre: [],
					duration: 0
				},
				media: null,
				mediaCount: 0,
				artistRefs: [],
				albumRef: null,
				agentId
			})

			const tracks: Track[] = [track1, track2, track3, track4]
			const savedTracks = tracks.map(addRefs)
			spyOn(tracksModel, 'save').mockResolvedValue([
				{
					current: savedTracks[0],
					previous: addRefs({
						...track1,
						tags: { album: oldName, artists: [artist1], genre: [], duration: 0 }
					})
				},
				{
					current: savedTracks[1],
					previous: addRefs({
						...track2,
						tags: { album: oldName, artists: [artist3], genre: [], duration: 0 }
					})
				},
				{
					current: savedTracks[2],
					previous: addRefs({
						...track3,
						tags: {
							album: updatedName,
							artists: [artist1, artist2],
							genre: [],
							duration: 0
						}
					})
				},
				{ current: savedTracks[3], previous: null }
			])

			const oldAlbum: Partial<Album> = addId({
				name: oldName,
				trackIds: [],
				removedTrackIds: [track1.id, track2.id]
			})

			const updatedAlbum: Partial<Album> = addId({
				name: updatedName,
				removedTrackIds: [track3.id],
				trackIds: [track4.id]
			})

			const newAlbum: Partial<Album> = addId({
				name: newName,
				agentId,
				trackIds: [track1.id, track2.id, track3.id],
				removedTrackIds: [],
				media: null
			})

			albumsSave.mockResolvedValueOnce({
				saved: [oldAlbum, updatedAlbum, newAlbum] as Album[],
				removedIds: []
			})

			await service.add(tracks)

			expect(spyOn(tracksModel, 'save')).toHaveBeenCalledWith(tracks)
			expect(spyOn(tracksModel, 'save')).toHaveBeenCalledTimes(1)
			expect(albumsSave).toHaveBeenCalledWith([
				newAlbum,
				oldAlbum,
				updatedAlbum
			])
			expect(albumsSave).toHaveBeenCalledTimes(1)
		})

		it('detects artist changes for existing tracks', async () => {
			const oldName = faker.system.filePath()
			const updatedName = faker.system.filePath()
			const newName = faker.system.filePath()

			const track1 = addId({
				path: faker.system.fileName(),
				mtimeMs: 0,
				tags: { artists: [newName, updatedName], genre: [], duration: 0 },
				media: null,
				mediaCount: 0,
				artistRefs: [],
				albumRef: null,
				agentId
			})
			const track2 = addId({
				path: faker.system.fileName(),
				mtimeMs: 0,
				tags: { artists: [newName], genre: [], duration: 0 },
				media: null,
				mediaCount: 0,
				artistRefs: [],
				albumRef: null,
				agentId
			})

			const tracks: Track[] = [track1, track2]
			const savedTracks = tracks.map(addRefs)
			spyOn(tracksModel, 'save').mockResolvedValue([
				{
					current: savedTracks[0],
					previous: addRefs({
						...track1,
						tags: { artists: [oldName], genre: [], duration: 0 }
					})
				},
				{
					current: savedTracks[1],
					previous: addRefs({
						...track2,
						tags: { artists: [oldName, updatedName], genre: [], duration: 0 }
					})
				}
			])

			const oldArtist: Partial<Artist> = addId({
				name: oldName,
				trackIds: [],
				removedTrackIds: [track1.id, track2.id]
			})
			const updatedArtist: Partial<Artist> = addId({
				name: updatedName,
				agentId,
				removedTrackIds: [track2.id],
				trackIds: [track1.id],
				media: null
			})
			const newArtist: Partial<Artist> = addId({
				name: newName,
				agentId,
				trackIds: [track1.id, track2.id],
				removedTrackIds: [],
				media: null
			})
			artistsSave.mockResolvedValueOnce({
				saved: [oldArtist, updatedArtist, newArtist] as Artist[],
				removedIds: []
			})
			const unknownAlbum: Partial<Album> = {
				agentId,
				id: 1,
				trackIds: tracks.map(({ id }) => id),
				removedTrackIds: []
			}
			albumsSave.mockResolvedValueOnce({
				saved: [unknownAlbum as Album],
				removedIds: []
			})

			await service.add(tracks)

			expect(artistsSave).toHaveBeenCalledWith([
				newArtist,
				updatedArtist,
				oldArtist
			])
			expect(artistsSave).toHaveBeenCalledTimes(1)
			expect(albumsSave).toHaveBeenCalledWith([unknownAlbum])
			expect(albumsSave).toHaveBeenCalledTimes(1)
		})
	})

	describe('remove()', () => {
		it('updates album', async () => {
			const name = faker.music.album()
			const path = faker.system.fileName()
			const artistNames = [faker.music.artist(), faker.music.artist()]

			const album: PartialWithReq<Album, 'id'> = addId({
				name,
				removedTrackIds: [hash(path)],
				trackIds: []
			})
			const tracks: Track[] = [
				{
					path,
					mtimeMs: 0,
					tags: { album: name, artists: artistNames, genre: [], duration: 0 },
					media: null,
					mediaCount: 0,
					artistRefs: [],
					albumRef: null,
					agentId
				}
			]
				.map(addId)
				.map(addRefs)
			const trackIds = tracks.map(({ id }) => id)

			const savedArtists: Partial<Artist>[] = artistNames.map(name =>
				addId({
					name,
					trackIds: [],
					removedTrackIds: trackIds
				})
			)
			tracksRemoveByIds.mockResolvedValueOnce(tracks)
			albumsSave.mockResolvedValueOnce({
				saved: [],
				removedIds: [album.id]
			})
			artistsSave.mockResolvedValueOnce({
				saved: savedArtists as Artist[],
				removedIds: []
			})

			await service.remove(trackIds)
			await setTimeout(200)

			expect(tracksRemoveByIds).toHaveBeenCalledWith(trackIds)
			expect(tracksRemoveByIds).toHaveBeenCalledTimes(1)
			expect(albumsSave).toHaveBeenCalledWith([album])
			expect(albumsSave).toHaveBeenCalledTimes(1)
			expect(artistsSave).toHaveBeenCalledWith(savedArtists)
			expect(artistsSave).toHaveBeenCalledTimes(1)
		})

		it('updates artists', async () => {
			const path = faker.system.fileName()
			const artistNames = [faker.music.artist(), faker.music.artist()]
			const savedArtists: PartialWithReq<Artist, 'id'>[] = artistNames.map(
				name => addId({ name, removedTrackIds: [hash(path)], trackIds: [] })
			)
			const tracks: Track[] = [
				{
					path,
					mtimeMs: 0,
					tags: { artists: artistNames, genre: [], duration: 0 },
					media: null,
					mediaCount: 0,
					artistRefs: [],
					albumRef: null,
					agentId
				}
			]
				.map(addId)
				.map(addRefs)
			const trackIds = tracks.map(({ id }) => id)
			tracksRemoveByIds.mockResolvedValueOnce(tracks)
			const unknownAlbum: Album = {
				agentId: null,
				id: 1,
				name: faker.music.album(),
				removedTrackIds: [hash(path)],
				trackIds: [],
				refs: [],
				media: null,
				mediaCount: 0,
				mtimeMs: Date.now()
			}
			artistsSave.mockResolvedValueOnce({
				saved: [],
				removedIds: savedArtists.map(({ id }) => id)
			})
			albumsSave.mockResolvedValueOnce({
				saved: [unknownAlbum],
				removedIds: []
			})

			await service.remove(trackIds)
			await setTimeout(200)

			expect(tracksRemoveByIds).toHaveBeenCalledWith(trackIds)
			expect(tracksRemoveByIds).toHaveBeenCalledTimes(1)
			expect(artistsSave).toHaveBeenCalledWith(savedArtists)
			expect(artistsSave).toHaveBeenCalledTimes(1)
		})

		it('sends changes before removals', async () => {
			const path1 = faker.system.fileName()
			const path2 = faker.system.fileName()
			const artistNames = [faker.music.artist(), faker.music.artist()]
			const savedArtists: PartialWithReq<Artist, 'id'>[] = [
				{
					name: artistNames[0],
					removedTrackIds: [hash(path1), hash(path2)],
					trackIds: []
				},
				{
					name: artistNames[1],
					removedTrackIds: [hash(path1)],
					trackIds: []
				}
			].map(addId)
			const tracks: Track[] = [
				{
					path: path1,
					mtimeMs: 0,
					tags: { artists: artistNames, genre: [], duration: 0 },
					media: null,
					mediaCount: 0,
					artistRefs: [],
					albumRef: null,
					agentId
				},
				{
					path: path2,
					mtimeMs: 0,
					tags: { artists: artistNames.slice(0, 1), genre: [], duration: 0 },
					media: null,
					mediaCount: 0,
					artistRefs: [],
					albumRef: null,
					agentId
				}
			]
				.map(addId)
				.map(addRefs)
			const trackIds = tracks.map(({ id }) => id)

			tracksRemoveByIds.mockResolvedValueOnce(tracks)
			const unknownAlbum: Partial<Album> = {
				id: 1,
				removedTrackIds: trackIds,
				trackIds: []
			}
			artistsSave.mockResolvedValueOnce({
				saved: [savedArtists[0] as Artist],
				removedIds: [savedArtists[1].id]
			})
			albumsSave.mockResolvedValueOnce({
				saved: [unknownAlbum as Album],
				removedIds: []
			})

			await service.remove(trackIds)
			await setTimeout(200)

			expect(tracksRemoveByIds).toHaveBeenCalledWith(trackIds)
			expect(tracksRemoveByIds).toHaveBeenCalledTimes(1)
			expect(artistsSave).toHaveBeenCalledWith(savedArtists)
			expect(artistsSave).toHaveBeenCalledTimes(1)
			expect(albumsSave).toHaveBeenCalledWith([unknownAlbum])
			expect(albumsSave).toHaveBeenCalledTimes(1)
		})
	})
})
