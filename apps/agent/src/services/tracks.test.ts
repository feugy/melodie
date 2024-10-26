import { setTimeout } from 'node:timers/promises'
import { faker } from '@faker-js/faker'
import * as models from '@melodie/common/models'
import type { Album, Artist, Track } from '@melodie/common/models'
import { addId, addRefs } from '@melodie/common/tests'
import type { PartialWithReq } from '@melodie/common/types'
import { hash } from '@melodie/common/utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { tracksService as service } from './tracks.ts'

vi.mock('@melodie/common/models', () => ({
	albumsModel: { save: vi.fn() },
	artistsModel: { save: vi.fn() },
	tracksModel: { save: vi.fn(), removeByIds: vi.fn() }
}))

const albumsModel = vi.mocked(models.albumsModel)
const artistsModel = vi.mocked(models.artistsModel)
const tracksModel = vi.mocked(models.tracksModel)

describe('Tracks service', () => {
	const agentId = faker.number.int()

	beforeEach(() => {
		vi.resetAllMocks()
		albumsModel.save.mockResolvedValue({ saved: [], removedIds: [] })
		artistsModel.save.mockResolvedValue({ saved: [], removedIds: [] })
		tracksModel.save.mockResolvedValue([])
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
					mediaCount: 0,
					artistRefs: [],
					albumRef: null,
					agentId
				}
			].map(addId)
			const savedArtists: Partial<Artist>[] = artistNames.map(name =>
				addId({ name, trackIds: [hash(path)], agentId, removedTrackIds: [] })
			)
			const unknownAlbum: Partial<Album> = {
				id: 1,
				agentId,
				trackIds: tracks.map(({ id }) => id),
				removedTrackIds: []
			}
			tracksModel.save.mockResolvedValue(
				tracks.map(addRefs).map(current => ({ current, previous: null }))
			)
			artistsModel.save.mockResolvedValueOnce({
				saved: savedArtists as Artist[],
				removedIds: []
			})
			albumsModel.save.mockResolvedValueOnce({
				saved: [unknownAlbum as Album],
				removedIds: []
			})

			await service.add(tracks)

			expect(tracksModel.save).toHaveBeenCalledWith(tracks)
			expect(tracksModel.save).toHaveBeenCalledOnce()
			expect(artistsModel.save).toHaveBeenCalledWith(savedArtists)
			expect(artistsModel.save).toHaveBeenCalledOnce()
			expect(albumsModel.save).toHaveBeenCalledWith([unknownAlbum])
			expect(albumsModel.save).toHaveBeenCalledOnce()
		})

		it('stores track with album', async () => {
			const name = faker.music.album()
			const path = faker.system.fileName()
			const tracks: Track[] = [
				{
					mtimeMs: 0,
					path,
					tags: { album: name, artists: [], genre: [], duration: 0 },
					mediaCount: 0,
					artistRefs: [],
					albumRef: null,
					agentId
				}
			].map(addId)
			tracksModel.save.mockResolvedValue(
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
				removedTrackIds: []
			})
			albumsModel.save.mockResolvedValueOnce({
				saved: [savedAlbum as Album],
				removedIds: []
			})
			artistsModel.save.mockResolvedValueOnce({
				saved: [unknownArtist as Artist],
				removedIds: []
			})

			await service.add(tracks)

			expect(tracksModel.save).toHaveBeenCalledWith(tracks)
			expect(tracksModel.save).toHaveBeenCalledOnce()
			expect(albumsModel.save).toHaveBeenCalledWith([savedAlbum])
			expect(albumsModel.save).toHaveBeenCalledOnce()
			expect(artistsModel.save).toHaveBeenCalledWith([unknownArtist])
			expect(artistsModel.save).toHaveBeenCalledOnce()
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
			tracksModel.save.mockResolvedValue(
				savedTracks.map(current => ({ current, previous: null }))
			)
			albumsModel.save.mockResolvedValueOnce({
				saved: [savedAlbum as Album],
				removedIds: []
			})
			artistsModel.save.mockResolvedValueOnce({
				saved: [unknownArtist as Artist],
				removedIds: []
			})

			await service.add(tracks)

			expect(tracksModel.save).toHaveBeenCalledWith(tracks)
			expect(tracksModel.save).toHaveBeenCalledOnce()
			expect(albumsModel.save).toHaveBeenCalledWith([savedAlbum])
			expect(albumsModel.save).toHaveBeenCalledOnce()
		})

		it('skips existing albums', async () => {
			const name = faker.music.album()
			const artist1 = faker.music.artist()
			const artist2 = faker.music.artist()
			const track1 = addId({
				path: faker.system.fileName(),
				mtimeMs: 0,
				tags: { album: name, artists: [artist1], genre: [], duration: 0 },
				mediaCount: 0,
				artistRefs: [],
				albumRef: null,
				agentId
			})
			const track2 = addId({
				path: faker.system.fileName(),
				mtimeMs: 0,
				tags: { album: name, artists: [artist2], genre: [], duration: 0 },
				mediaCount: 0,
				artistRefs: [],
				albumRef: null,
				agentId
			})
			const track3 = addId({
				path: faker.system.fileName(),
				mtimeMs: 0,
				tags: { album: name, artists: [artist2], genre: [], duration: 0 },
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
				removedTrackIds: []
			})
			const savedArtists: Partial<Artist>[] = [
				{ name: artist1, agentId, trackIds: [track1.id], removedTrackIds: [] },
				{
					name: artist2,
					agentId,
					trackIds: [track2.id, track3.id],
					removedTrackIds: []
				}
			].map(addId)
			const savedTracks = tracks.map(addRefs)
			tracksModel.save.mockResolvedValue(
				savedTracks.map(current => ({ current, previous: null }))
			)
			albumsModel.save.mockResolvedValueOnce({
				saved: [savedAlbum as Album],
				removedIds: []
			})
			artistsModel.save.mockResolvedValueOnce({
				saved: savedArtists as Artist[],
				removedIds: []
			})

			await service.add(tracks)

			expect(tracksModel.save).toHaveBeenCalledWith(tracks)
			expect(tracksModel.save).toHaveBeenCalledOnce()
			expect(albumsModel.save).toHaveBeenCalledWith([savedAlbum])
			expect(albumsModel.save).toHaveBeenCalledOnce()
			expect(artistsModel.save).toHaveBeenCalledWith(savedArtists)
			expect(artistsModel.save).toHaveBeenCalledOnce()
		})

		it('skips existing artists', async () => {
			const artist1 = faker.system.filePath()
			const artist2 = faker.system.filePath()
			const artist3 = faker.system.filePath()
			const track1: Track = addId({
				path: faker.system.fileName(),
				mtimeMs: 0,
				tags: { artists: [artist1, artist2], genre: [], duration: 0 },
				mediaCount: 0,
				artistRefs: [],
				albumRef: null,
				agentId
			})
			const track2: Track = addId({
				path: faker.system.fileName(),
				mtimeMs: 0,
				tags: { artists: [artist2, artist3], genre: [], duration: 0 },
				mediaCount: 0,
				artistRefs: [],
				albumRef: null,
				agentId
			})
			const track3: Track = addId({
				path: faker.system.fileName(),
				mtimeMs: 0,
				tags: { artists: [artist3], genre: [], duration: 0 },
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
					removedTrackIds: []
				},
				{
					name: artist2,
					agentId,
					trackIds: [track1.id, track2.id],
					removedTrackIds: []
				},
				{
					name: artist3,
					agentId,
					trackIds: [track2.id, track3.id],
					removedTrackIds: []
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
			tracksModel.save.mockResolvedValue(
				savedTracks.map(current => ({ current, previous: null }))
			)
			artistsModel.save.mockResolvedValueOnce({
				saved: savedArtists as Artist[],
				removedIds: []
			})
			albumsModel.save.mockResolvedValueOnce({
				saved: [unknownAlbum as Album],
				removedIds: []
			})

			await service.add(tracks)

			expect(tracksModel.save).toHaveBeenCalledWith(tracks)
			expect(tracksModel.save).toHaveBeenCalledOnce()
			expect(artistsModel.save).toHaveBeenCalledWith(savedArtists)
			expect(artistsModel.save).toHaveBeenCalledOnce()
			expect(albumsModel.save).toHaveBeenCalledWith([unknownAlbum])
			expect(albumsModel.save).toHaveBeenCalledOnce()
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
				mediaCount: 0,
				artistRefs: [],
				albumRef: null,
				agentId
			})
			const track2 = addId({
				path: faker.system.fileName(),
				mtimeMs: 0,
				tags: { album: newName, artists: [artist1], genre: [], duration: 0 },
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
				mediaCount: 0,
				artistRefs: [],
				albumRef: null,
				agentId
			})

			const tracks: Track[] = [track1, track2, track3, track4]
			const savedTracks = tracks.map(addRefs)
			tracksModel.save.mockResolvedValue([
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
				removedTrackIds: []
			})

			albumsModel.save.mockResolvedValueOnce({
				saved: [oldAlbum, updatedAlbum, newAlbum] as Album[],
				removedIds: []
			})

			await service.add(tracks)

			expect(tracksModel.save).toHaveBeenCalledWith(tracks)
			expect(tracksModel.save).toHaveBeenCalledOnce()
			expect(albumsModel.save).toHaveBeenCalledWith([
				newAlbum,
				oldAlbum,
				updatedAlbum
			])
			expect(albumsModel.save).toHaveBeenCalledOnce()
		})

		it('detects artist changes for existing tracks', async () => {
			const oldName = faker.system.filePath()
			const updatedName = faker.system.filePath()
			const newName = faker.system.filePath()

			const track1 = addId({
				path: faker.system.fileName(),
				mtimeMs: 0,
				tags: { artists: [newName, updatedName], genre: [], duration: 0 },
				mediaCount: 0,
				artistRefs: [],
				albumRef: null,
				agentId
			})
			const track2 = addId({
				path: faker.system.fileName(),
				mtimeMs: 0,
				tags: { artists: [newName], genre: [], duration: 0 },
				mediaCount: 0,
				artistRefs: [],
				albumRef: null,
				agentId
			})

			const tracks: Track[] = [track1, track2]
			const savedTracks = tracks.map(addRefs)
			tracksModel.save.mockResolvedValue([
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
				trackIds: [track1.id]
			})
			const newArtist: Partial<Artist> = addId({
				name: newName,
				agentId,
				trackIds: [track1.id, track2.id],
				removedTrackIds: []
			})
			artistsModel.save.mockResolvedValueOnce({
				saved: [oldArtist, updatedArtist, newArtist] as Artist[],
				removedIds: []
			})
			const unknownAlbum: Partial<Album> = {
				agentId,
				id: 1,
				trackIds: tracks.map(({ id }) => id),
				removedTrackIds: []
			}
			albumsModel.save.mockResolvedValueOnce({
				saved: [unknownAlbum as Album],
				removedIds: []
			})

			await service.add(tracks)

			expect(artistsModel.save).toHaveBeenCalledWith([
				newArtist,
				updatedArtist,
				oldArtist
			])
			expect(artistsModel.save).toHaveBeenCalledOnce()
			expect(albumsModel.save).toHaveBeenCalledWith([unknownAlbum])
			expect(albumsModel.save).toHaveBeenCalledOnce()
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
			tracksModel.removeByIds.mockResolvedValueOnce(tracks)
			albumsModel.save.mockResolvedValueOnce({
				saved: [],
				removedIds: [album.id]
			})
			artistsModel.save.mockResolvedValueOnce({
				saved: savedArtists as Artist[],
				removedIds: []
			})

			await service.remove(trackIds)
			await setTimeout(200)

			expect(tracksModel.removeByIds).toHaveBeenCalledWith(trackIds)
			expect(tracksModel.removeByIds).toHaveBeenCalledOnce()
			expect(albumsModel.save).toHaveBeenCalledWith([album])
			expect(albumsModel.save).toHaveBeenCalledOnce()
			expect(artistsModel.save).toHaveBeenCalledWith(savedArtists)
			expect(artistsModel.save).toHaveBeenCalledOnce()
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
					mediaCount: 0,
					artistRefs: [],
					albumRef: null,
					agentId
				}
			]
				.map(addId)
				.map(addRefs)
			const trackIds = tracks.map(({ id }) => id)
			tracksModel.removeByIds.mockResolvedValueOnce(tracks)
			const unknownAlbum: Album = {
				agentId: null,
				id: 1,
				name: faker.music.album(),
				removedTrackIds: [hash(path)],
				trackIds: [],
				refs: [],
				mediaCount: 0,
				mtimeMs: Date.now()
			}
			artistsModel.save.mockResolvedValueOnce({
				saved: [],
				removedIds: savedArtists.map(({ id }) => id)
			})
			albumsModel.save.mockResolvedValueOnce({
				saved: [unknownAlbum],
				removedIds: []
			})

			await service.remove(trackIds)
			await setTimeout(200)

			expect(tracksModel.removeByIds).toHaveBeenCalledWith(trackIds)
			expect(tracksModel.removeByIds).toHaveBeenCalledOnce()
			expect(artistsModel.save).toHaveBeenCalledWith(savedArtists)
			expect(artistsModel.save).toHaveBeenCalledOnce()
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
					mediaCount: 0,
					artistRefs: [],
					albumRef: null,
					agentId
				},
				{
					path: path2,
					mtimeMs: 0,
					tags: { artists: artistNames.slice(0, 1), genre: [], duration: 0 },
					mediaCount: 0,
					artistRefs: [],
					albumRef: null,
					agentId
				}
			]
				.map(addId)
				.map(addRefs)
			const trackIds = tracks.map(({ id }) => id)

			tracksModel.removeByIds.mockResolvedValueOnce(tracks)
			const unknownAlbum: Partial<Album> = {
				id: 1,
				removedTrackIds: trackIds,
				trackIds: []
			}
			artistsModel.save.mockResolvedValueOnce({
				saved: [savedArtists[0] as Artist],
				removedIds: [savedArtists[1].id]
			})
			albumsModel.save.mockResolvedValueOnce({
				saved: [unknownAlbum as Album],
				removedIds: []
			})

			await service.remove(trackIds)
			await setTimeout(200)

			expect(tracksModel.removeByIds).toHaveBeenCalledWith(trackIds)
			expect(tracksModel.removeByIds).toHaveBeenCalledOnce()
			expect(artistsModel.save).toHaveBeenCalledWith(savedArtists)
			expect(artistsModel.save).toHaveBeenCalledOnce()
			expect(albumsModel.save).toHaveBeenCalledWith([unknownAlbum])
			expect(albumsModel.save).toHaveBeenCalledOnce()
		})
	})
})
