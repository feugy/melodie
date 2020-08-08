'use strict'

const AbstractProvider = require('./abstract-provider')

class Test extends AbstractProvider {
  constructor() {
    super('test')
  }
}

describe('Abstract provider', () => {
  it('throws error on unsupported operations', () => {
    const provider = new Test()
    expect(provider.findArtistArtwork()).rejects.toThrow(
      /test does not support findArtistArtwork/
    )
    expect(provider.findAlbumCover()).rejects.toThrow(
      /test does not support findAlbumCover/
    )
  })
})
