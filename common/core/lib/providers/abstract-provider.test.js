import { describe, expect, it } from 'vitest'

import AbstractProvider from './abstract-provider'

class Test extends AbstractProvider {
  constructor() {
    super('test')
  }
}

describe('Abstract provider', () => {
  const provider = new Test()

  it('returns empty artworks array for artist', async () => {
    expect(await provider.findArtistArtwork()).toEqual([])
  })

  it('returns empty covers array for album', async () => {
    expect(await provider.findAlbumCover()).toEqual([])
  })

  it('returns empty tracks on import', async () => {
    expect(await provider.importTracks()).toEqual([])
  })

  it('returns no saved tracks nor removed ids on compare', async () => {
    expect(await provider.compareTracks()).toEqual({
      saved: [],
      removedIds: []
    })
  })
})
