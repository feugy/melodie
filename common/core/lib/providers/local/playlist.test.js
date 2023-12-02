import { tmpdir } from 'os'
import { join, relative, resolve, sep } from 'path'
const {
  access,
  constants,
  ensureFile,
  mkdtemp,
  readFile,
  writeFile
} = require('fs-extra')
import { faker } from '@faker-js/faker'
import { beforeAll, describe, expect, it } from 'vitest'

import { hash } from '../../utils'
import { isPlaylistFile, read, write } from './playlist'

const fixtures = resolve(__dirname, '..', '..', '..', '..', 'fixtures')
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

  describe.each([
    ['m3u', 'latin1'],
    ['m3u8', 'utf8']
  ])('given a playlist', (ext, encoding) => {
    const tracks = []

    beforeAll(async () => {
      const path1 = resolve(album, "01 - Norah Jones - Don't Know Why.ogg")
      const path2 = resolve(fixtures, 'file.flac')
      const path3 = resolve(folder, 'file.ogg')
      const path4 = resolve(folder, '..', '..', faker.lorem.words(), 'file.mp3')
      const path5 = resolve(folder, '# movies', 'file.ogg')

      tracks.splice(
        0,
        tracks.length,
        {
          id: hash(path1),
          path: path1,
          tags: {
            title: faker.lorem.words(),
            duration: faker.number.int({ max: 500 })
          }
        },
        {
          id: hash(path2),
          path: path2,
          tags: {
            title: faker.lorem.words(),
            duration: faker.number.int({ max: 500 })
          }
        },
        {
          id: hash(path3),
          path: path3,
          tags: {
            title: faker.lorem.words(),
            duration: faker.number.int({ max: 500 })
          }
        },
        {
          id: hash(path4),
          path: path4,
          tags: {
            title: faker.lorem.words(),
            duration: faker.number.int({ max: 500 })
          }
        },
        {
          id: hash(path5),
          path: path5,
          tags: {
            title: faker.lorem.words(),
            duration: faker.number.int({ max: 500 })
          }
        }
      )
    })

    it(`writes a new ${ext} file using relative paths`, async () => {
      const path = join(folder, `playlist.${ext}`)
      const playlist = {
        id: hash(path),
        name: faker.commerce.productName(),
        trackIds: tracks.map(({ id }) => id),
        tracks
      }

      await write(path, playlist)
      expect(await readFile(path, encoding)).toEqual(
        [
          '#EXTM3U',
          `#PLAYLIST:${playlist.name}`,
          `#EXTINF:${tracks[0].tags.duration},${tracks[0].tags.title}`,
          relative(folder, tracks[0].path),
          `#EXTINF:${tracks[1].tags.duration},${tracks[1].tags.title}`,
          relative(folder, tracks[1].path),
          `#EXTINF:${tracks[2].tags.duration},${tracks[2].tags.title}`,
          relative(folder, tracks[2].path),
          `#EXTINF:${tracks[3].tags.duration},${tracks[3].tags.title}`,
          relative(folder, tracks[3].path),
          `#EXTINF:${tracks[4].tags.duration},${tracks[4].tags.title}`,
          tracks[4].path
        ].join(encoding === 'utf8' ? '\n' : '\r\n')
      )
    })

    it(`overwrites an existing ${ext} file`, async () => {
      const path = join(folder, `existing.${ext}`)
      await ensureFile(path)

      const playlist = {
        id: hash(path),
        name: faker.commerce.productName(),
        trackIds: [tracks[4].id],
        tracks: tracks.slice(4)
      }

      await write(path, playlist)
      expect(await readFile(path, encoding)).toEqual(
        [
          '#EXTM3U',
          `#PLAYLIST:${playlist.name}`,
          `#EXTINF:${tracks[4].tags.duration},${tracks[4].tags.title}`,
          tracks[4].path
        ].join(encoding === 'utf8' ? '\n' : '\r\n')
      )
    })

    it(`does not create ${ext} file for an empty playlist`, async () => {
      const path = join(folder, `no-tracks.${ext}`)
      await write(path, {
        id: hash(path),
        name: faker.commerce.productName(),
        trackIds: [],
        tracks: []
      })
      await expect(access(path, constants.R_OK)).rejects.toThrow('ENOENT')
    })
  })
})
