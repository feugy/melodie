'use strict'

const { resolve, join, sep } = require('path')
const { tmpdir } = require('os')
const { mkdtemp, writeFile } = require('fs-extra')
const faker = require('faker')
const { hash } = require('../../utils')
const { read, isPlaylistFile } = require('./playlist')

const fixtures = resolve(__dirname, '..', '..', '..', 'fixtures')
const album =
  sep +
  join('home', 'damien', 'Musique', 'Norah Jones', '(2002) Come Away With Me')
const track1 = resolve(album, "01 - Norah Jones - Don't Know Why.ogg")
const track2 = resolve(album, '02 - Norah Jones - Seven Years.ogg')
const track3 = resolve(fixtures, 'file.flac')
const track4 = resolve(fixtures, 'file.ogg')

describe('Playlist local utilities', () => {
  let folder

  beforeAll(async () => {
    folder = await mkdtemp(join(tmpdir(), 'melodie-'))
  })

  describe('isPlaylistFile()', () => {
    it.each([
      [true, faker.system.fileName().replace(/\..+$/, '.m3u')],
      [true, faker.system.fileName().replace(/\..+$/, '.m3u8')],
      [false, faker.system.fileName().replace(/\..+$/, '.mp3')],
      [false, faker.system.fileName().replace(/\..+$/, '.ogg')],
      [false, faker.system.fileName().replace(/\..+$/, '.txt')]
    ])('returns %s for file %s', (match, file) => {
      expect(isPlaylistFile(file)).toEqual(match)
    })
  })

  describe.each([
    ['m3u', 'latin1'],
    ['m3u8', 'utf8']
  ])('given %s files', (ext, encoding) => {
    it('reads absoluve urls', async () => {
      const name = 'absolutes'
      const playlist = join(folder, `${name}.${ext}`)
      await writeFile(
        playlist,
        `#EXTM3U
${track1}
${track2}
${track3}
${track4}`,
        { encoding }
      )

      expect(await read(playlist)).toEqual({
        id: hash(playlist),
        name,
        trackIds: [track1, track2, track3, track4].map(hash)
      })
    })

    it('reads relative urls', async () => {
      const name = 'relatives'
      const playlist = join(folder, `${name}.${ext}`)
      await writeFile(
        playlist,
        `#EXTM3U
${join('..', 'fixtures', 'track.mp3')}
file.ogg
${join('nested', 'music.flac')}`,
        { encoding }
      )

      expect(await read(playlist)).toEqual({
        id: hash(playlist),
        name,
        trackIds: [
          join(folder, '..', 'fixtures', 'track.mp3'),
          join(folder, 'file.ogg'),
          join(folder, 'nested', 'music.flac')
        ].map(hash)
      })
    })

    it('reads file urls', async () => {
      const name = 'file-protocol'
      const playlist = join(folder, `${name}.${ext}`)
      await writeFile(
        playlist,
        `#EXTM3U
file://${encodeURI(track1)}
file://${encodeURI(track2)}
file://${encodeURI(track3)}
file://${encodeURI(track4)}`,
        { encoding }
      )

      expect(await read(playlist)).toEqual({
        id: hash(playlist),
        name,
        trackIds: [track1, track2, track3, track4].map(hash)
      })
    })

    it('reads playlist name', async () => {
      const name = faker.commerce.productName()
      const playlist = join(folder, `named.${ext}`)
      await writeFile(
        playlist,
        `#EXTM3U
${track1}
#PLAYLIST: ${name}
${track3}`,
        { encoding }
      )

      expect(await read(playlist)).toEqual({
        id: hash(playlist),
        name,
        trackIds: [track1, track3].map(hash)
      })
    })

    it('ignores nested playlists', async () => {
      const name = 'nested'
      const playlist = join(folder, `${name}.${ext}`)
      await writeFile(
        playlist,
        `#EXTM3U
${track1}
nested.${ext}
${track2}`,
        { encoding }
      )

      expect(await read(playlist)).toEqual({
        id: hash(playlist),
        name,
        trackIds: [track1, track2].map(hash)
      })
    })

    it('ignores folders', async () => {
      const name = 'folders'
      const playlist = join(folder, `${name}.${ext}`)
      await writeFile(
        playlist,
        `#EXTM3U
${folder}
${fixtures}
nested
${track2}
`,
        { encoding }
      )

      expect(await read(playlist)).toEqual({
        id: hash(playlist),
        name,
        trackIds: [track2].map(hash)
      })
    })

    it('ignores web urls', async () => {
      const name = 'urls'
      const playlist = join(folder, `${name}.${ext}`)
      await writeFile(
        playlist,
        `#EXTM3U
file://${encodeURI(track1)}
http://example.com/track.mp3
${track2}
https://example.com/track.ogg
`,
        { encoding }
      )

      expect(await read(playlist)).toEqual({
        id: hash(playlist),
        name,
        trackIds: [track1, track2].map(hash)
      })
    })

    it('ignores empty m3u file', async () => {
      const playlist = join(folder, `empty.${ext}`)
      await writeFile(
        playlist,
        `#EXTM3U
# ${track1}


# ${track2}
`,
        { encoding }
      )

      expect(await read(playlist)).toBeNull()
    })

    it('handles unknown file', async () => {
      expect(await read(resolve(__dirname, `unknown.${ext}`))).toBeNull()
    })
  })
})
