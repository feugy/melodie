import { disksData } from '../DisksList/DisksList.testdata'

export const tracksData = disksData.map((track, i) => ({
  ...track,
  tags: {
    ...track.tags,
    track: { no: i + 1 }
  }
}))
