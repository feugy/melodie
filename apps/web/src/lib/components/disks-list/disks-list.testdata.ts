import type { Track } from '@melodie/common/models'
import { addId, makeRef } from '@melodie/common/tests/refs'
import type { Reference } from '@melodie/common/utils'

const album = 'Cowboy Bebop - NoDisc'
const artists = ['Yoko Kanno', 'the Seatbelts']
const albumRef: Reference = makeRef(album)
const artistRefs: Reference[] = artists.map(makeRef)

export const disksData: Track[] = [
	{
		mtimeMs: 0,
		agentId: null,
		path: '',
		mediaCount: 1,
		media: './cover.jpg',
		tags: {
			title: 'American Money',
			artists,
			album,
			genre: [],
			duration: 332,
			track: { no: 1 }
		},
		albumRef,
		artistRefs
	},
	{
		mtimeMs: 0,
		agentId: null,
		path: '',
		mediaCount: 1,
		media: './cover.jpg',
		tags: {
			title: 'Fantaisie Sign',
			artists,
			album,
			genre: [],
			duration: 215,
			track: { no: 2 }
		},
		albumRef,
		artistRefs
	},
	{
		mtimeMs: 0,
		agentId: null,
		path: '',
		mediaCount: 1,
		media: './cover.jpg',
		tags: {
			title: "Don't Bother None",
			artists,
			album,
			genre: [],
			duration: 225,
			disk: { no: 1 },
			track: { no: 3 }
		},
		albumRef,
		artistRefs
	},
	{
		mtimeMs: 0,
		agentId: null,
		path: '',
		mediaCount: 1,
		media: null,
		tags: {
			title: 'Vitamin A',
			artists,
			album,
			genre: [],
			duration: 281,
			disk: { no: 1 },
			track: { no: 2 }
		},
		albumRef,
		artistRefs
	},
	{
		mtimeMs: 0,
		agentId: null,
		path: '',
		mediaCount: 1,
		media: null,
		tags: {
			title: 'LIVE in Baghdad',
			artists,
			album,
			genre: [],
			duration: 179,
			disk: { no: 2 },
			track: { no: 3 }
		},
		albumRef,
		artistRefs
	},
	{
		mtimeMs: 0,
		agentId: null,
		path: '',
		mediaCount: 1,
		media: null,
		tags: {
			title: 'Cats on Mars',
			artists,
			album,
			genre: [],
			duration: 7,
			disk: { no: 2 },
			track: { no: 2 }
		},
		albumRef,
		artistRefs
	},
	{
		mtimeMs: 0,
		agentId: null,
		path: '',
		mediaCount: 1,
		media: null,
		tags: {
			title: 'Want it All Back',
			artists,
			album,
			genre: [],
			duration: 231,
			disk: { no: 1 },
			track: { no: 4 }
		},
		albumRef,
		artistRefs
	},
	{
		mtimeMs: 0,
		agentId: null,
		path: '',
		mediaCount: 1,
		media: null,
		tags: {
			title: 'Bindy',
			artists,
			album,
			genre: [],
			duration: 15,
			disk: { no: 1 },
			track: { no: 5 }
		},
		albumRef,
		artistRefs
	},
	{
		mtimeMs: 0,
		agentId: null,
		path: '',
		mediaCount: 1,
		media: null,
		tags: {
			title: 'You Make Me Coo',
			artists,
			album,
			genre: [],
			duration: 194,
			disk: { no: 1 },
			track: { no: 6 }
		},
		albumRef,
		artistRefs
	},
	{
		mtimeMs: 0,
		agentId: null,
		path: '',
		mediaCount: 1,
		media: null,
		tags: {
			title: 'Vitamin B',
			artists,
			album,
			genre: [],
			duration: 246,
			disk: { no: 2 },
			track: { no: 4 }
		},
		albumRef,
		artistRefs
	},
	{
		mtimeMs: 0,
		agentId: null,
		path: '',
		mediaCount: 1,
		media: null,
		tags: {
			title: 'Green Bird',
			artists,
			album,
			genre: [],
			duration: 153,
			disk: { no: 2 },
			track: { no: 5 }
		},
		albumRef,
		artistRefs
	},
	{
		mtimeMs: 0,
		agentId: null,
		path: '',
		mediaCount: 1,
		media: null,
		tags: {
			title: 'ELM',
			artists,
			album,
			genre: [],
			duration: 415,
			disk: { no: 2 },
			track: { no: 6 }
		},
		albumRef,
		artistRefs
	},
	{
		mtimeMs: 0,
		agentId: null,
		path: '',
		mediaCount: 1,
		media: null,
		tags: {
			title: 'Vitamin C',
			artists,
			album,
			genre: [],
			duration: 324,
			disk: { no: 1 },
			track: { no: 7 }
		},
		albumRef,
		artistRefs
	},
	{
		mtimeMs: 0,
		agentId: null,
		path: '',
		mediaCount: 1,
		media: null,
		tags: {
			title: 'Gateway',
			artists,
			album,
			genre: [],
			duration: 16,
			disk: { no: 1 },
			track: { no: 8 }
		},
		albumRef,
		artistRefs
	},
	{
		mtimeMs: 0,
		agentId: null,
		path: '',
		mediaCount: 1,
		media: null,
		tags: {
			title: 'The Singing Sea',
			artists,
			album,
			genre: [],
			duration: 401,
			disk: { no: 2 },
			track: { no: 7 }
		},
		albumRef,
		artistRefs
	},
	{
		mtimeMs: 0,
		agentId: null,
		path: '',
		mediaCount: 1,
		media: null,
		tags: {
			title: 'The Egg and You!',
			artists,
			album,
			genre: [],
			duration: 287,
			disk: { no: 2 },
			track: { no: 8 }
		},
		albumRef,
		artistRefs
	},
	{
		mtimeMs: 0,
		agentId: null,
		path: '',
		mediaCount: 1,
		media: null,
		tags: {
			title: 'Forever Broke',
			artists,
			album,
			genre: [],
			duration: 96,
			disk: { no: 1 },
			track: { no: 9 }
		},
		albumRef,
		artistRefs
	},
	{
		mtimeMs: 0,
		agentId: null,
		path: '',
		mediaCount: 1,
		media: null,
		tags: {
			title: 'Power of Kungfu Remix',
			artists,
			album,
			genre: [],
			duration: 142,
			disk: { no: 2 },
			track: { no: 9 }
		},
		albumRef,
		artistRefs
	}
].map(track => {
	track.path = `./${album}/${track.tags.disk?.no ?? '1'}/${track.tags.track.no} ${track.tags.title}.mp3`
	return addId({ ...track, relativePath: track.path.slice(2) })
})
