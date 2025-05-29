import type { Track } from '@melodie/common/models'
import { disksData } from '../disks-list/disks-list.testdata'

export const tracksData: Track[] = disksData.map((track, i) => ({
	...track,
	tags: {
		...track.tags,
		track: { no: i + 1 }
	}
}))
