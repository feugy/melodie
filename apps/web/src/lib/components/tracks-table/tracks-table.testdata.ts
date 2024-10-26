import { disksData } from '../disks-list/disks-list.testdata'

export const tracksData = disksData.map((track, i) => ({
	...track,
	tags: {
		...track.tags,
		track: { no: i + 1 }
	}
}))
