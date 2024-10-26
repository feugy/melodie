import { faker } from '@faker-js/faker'
import { copy, mkdtemp, remove } from 'fs-extra'
import os from 'os'
import { resolve } from 'path'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import { read } from './tag-reader'

const fixtures = resolve(__dirname, '..', '..', '..', '..', 'fixtures')
const mp3 = resolve(fixtures, 'file.mp3')
const ogg = resolve(fixtures, 'file.ogg')
const flac = resolve(fixtures, 'file.flac')
const opus = resolve(fixtures, 'file.opus')
const wav = resolve(fixtures, 'file.wav')
const weba = resolve(fixtures, 'file.weba')
const webm = resolve(fixtures, 'file.webm')
const noDuration = resolve(fixtures, 'no-duration.mp3')
const untagged = resolve(fixtures, 'untagged.mp3')

describe('Tag reader', () => {
  it('reads mp3 file', async () => {
    expect(await read(mp3)).toEqual({
      album: 'Philharmonics',
      albumartist: null,
      artist: 'Agnes Obel',
      artists: ['Agnes Obel'],
      date: '2010',
      disk: { no: null, of: null },
      duration: 0.809795918367347,
      genre: ['Folk'],
      title: 'Falling, Catching',
      track: { no: 1, of: 12 },
      year: 2010,
      cover: {
        data: expect.any(Buffer),
        format: 'image/jpeg',
        description: 'cover.jpg',
        type: 'Cover (front)'
      },
      movementIndex: {}
    })
  })

  it('reads flac file', async () => {
    expect(await read(flac)).toEqual({
      album: 'Jagged Little Pill',
      albumartist: null,
      artist: 'Alanis Morissette',
      artists: ['Alanis Morissette'],
      date: '1995',
      disk: { no: null, of: null },
      duration: 2.640975056689342,
      genre: ['Pop'],
      title: 'All I really want',
      track: { no: 1, of: null },
      year: 1995,
      cover: {
        data: expect.any(Buffer),
        format: 'image/jpeg',
        description: 'cover.jpg',
        height: 700,
        width: 700,
        type: 'Cover (front)',
        indexed_color: 0,
        colour_depth: 0
      },
      movementIndex: {}
    })
  })

  it('reads ogg file', async () => {
    expect(await read(ogg)).toEqual({
      album: 'Dances With Wolves',
      albumartist: null,
      artist: 'John Barry',
      artists: ['John Barry'],
      date: '1990',
      disk: { no: null, of: null },
      duration: 2.4249433106575964,
      genre: ['Soundtrack'],
      title: 'Main Title - Looks Like A Suicide',
      track: { no: 1, of: null },
      year: 1990,
      cover: null,
      movementIndex: {}
    })
  })

  it('reads opus file', async () => {
    expect(await read(opus)).toEqual({
      album: 'Test files',
      albumartist: null,
      artist: 'Epicanis',
      artists: ['Epicanis'],
      disk: { no: null, of: null },
      duration: 174.0230625,
      title: 'Presentation file',
      track: { no: null, of: null },
      cover: {
        data: expect.any(Buffer),
        format: 'image/png',
        description: '',
        height: 512,
        width: 512,
        type: 'Cover (front)',
        indexed_color: 0,
        colour_depth: 0
      },
      year: null,
      genre: [],
      movementIndex: {},
      comment: ['Opus Audio']
    })
  })

  it('reads wave file', async () => {
    expect(await read(wav)).toEqual({
      album: 'Test files',
      albumartist: null,
      artist: 'Epicanis',
      artists: ['Epicanis'],
      disk: { no: null, of: null },
      duration: 23.916541666666667,
      title: 'A test wave file',
      track: { no: null, of: null },
      cover: {
        data: expect.any(Buffer),
        format: 'image/png',
        description: '',
        type: 'Cover (front)'
      },
      date: '2012',
      year: 2012,
      genre: [],
      movementIndex: {},
      comment: ['PCM Audio']
    })
  })

  it('reads weba file', async () => {
    expect(await read(weba)).toEqual({
      album: 'fixtures',
      albumartist: null,
      artist: null,
      artists: [],
      disk: { no: null, of: null },
      duration: 79.658672352,
      title: 'file',
      track: { no: null, of: null },
      cover: null,
      year: null,
      genre: [],
      movementIndex: {}
    })
  })

  it('reads webm file', async () => {
    expect(await read(webm)).toEqual({
      album: 'fixtures',
      albumartist: null,
      artist: 'Ivan "Epicanis" Privaci (pseud.)',
      artists: ['Ivan "Epicanis" Privaci (pseud.)'],
      disk: { no: null, of: null },
      duration: 27.632,
      encodedby: 'Lavc57.107.100 libopus',
      title: 'WEBMv2',
      track: { no: 3, of: null },
      genre: ['speech'],
      cover: null,
      year: null,
      movementIndex: {}
    })
  })

  it('reads duration when not returned in tags', async () => {
    expect(await read(noDuration)).toEqual({
      album: 'By The Way',
      albumartist: 'Red Hot Chili Peppers',
      artist: 'Red Hot Chili Peppers',
      artists: ['Red Hot Chili Peppers'],
      averageLevel: 9083,
      comment: [''],
      composer: [''],
      copyright: '',
      disk: { no: null, of: null },
      duration: 218.01795918367347,
      encodedby: '',
      genre: ['Rock'],
      label: ['Warner Bros.'],
      originalartist: '',
      rating: [
        {
          rating: 0,
          source: 'Windows Media Player 9 Series'
        }
      ],
      title: 'By The Way',
      track: { no: 1, of: 16 },
      year: 2002,
      cover: null,
      movementIndex: {}
    })
  })

  it('handles unknown file', async () => {
    expect(await read(resolve(__dirname, 'unknown.file'))).toEqual({
      album: 'local',
      albumartist: null,
      artist: null,
      artists: [],
      duration: 0,
      genre: [],
      title: 'unknown',
      year: null,
      cover: null
    })
  })

  it('handles unsupported file', async () => {
    expect(await read(__filename)).toEqual({
      album: 'local',
      albumartist: null,
      artist: 'tag',
      artists: [],
      duration: 0,
      genre: [],
      title: 'reader.test',
      year: null,
      cover: null
    })
  })

  describe('given untagged files', () => {
    let file
    const folder = resolve(os.tmpdir(), 'melodie-')

    beforeAll(() => mkdtemp(folder))

    afterEach(async () => {
      try {
        await remove(file)
      } catch {
        // ignore
      }
    })

    it('reads track number, artist and title from file name', async () => {
      const title = faker.helpers.arrayElement([
        'One More Time',
        'Harder, Better, Faster, Stronger',
        'Face To Face'
      ])
      const artist = faker.helpers.arrayElement(['Daft Punk', 'Phoenix'])
      const trackNo = faker.helpers.arrayElement([1, 5, 12])
      file = resolve(folder, `${trackNo}. ${artist} - ${title}.mp3`)
      await copy(untagged, file)

      expect(await read(file)).toEqual({
        album: 'melodie-',
        albumartist: null,
        artist,
        artists: [],
        duration: 0.809795918367347,
        genre: [],
        title,
        year: null,
        cover: null,
        track: { no: trackNo, of: null },
        disk: { no: null, of: null },
        movementIndex: {}
      })
    })

    it('reads track number and title from file name', async () => {
      const title = faker.helpers.arrayElement([
        'One More Time',
        'Harder, Better, Faster, Stronger',
        'Face To Face'
      ])
      const trackNo = faker.helpers.arrayElement([1, 5, 12])
      file = resolve(folder, `${trackNo} - ${title}.flac`)
      await copy(untagged, file)

      expect(await read(file)).toEqual({
        album: 'melodie-',
        albumartist: null,
        artist: null,
        artists: [],
        duration: 0,
        genre: [],
        title,
        year: null,
        cover: null,
        track: { no: trackNo, of: null }
      })
    })

    it('reads artist and title from file name', async () => {
      const title = faker.helpers.arrayElement([
        'One More Time',
        'Harder, Better, Faster, Stronger',
        'Face To Face'
      ])
      const artist = faker.helpers.arrayElement(['Daft Punk', 'Phoenix'])
      file = resolve(folder, `${artist}-${title}.ogg`)
      await copy(untagged, file)

      expect(await read(file)).toEqual({
        album: 'melodie-',
        albumartist: null,
        artist,
        artists: [],
        duration: 0,
        genre: [],
        title,
        year: null,
        cover: null,
        track: { no: null, of: null },
        disk: { no: null, of: null },
        movementIndex: {}
      })
    })

    it('reads title from file name', async () => {
      const title = faker.helpers.arrayElement([
        'One More Time',
        'Harder, Better, Faster, Stronger',
        'Face To Face'
      ])
      file = resolve(folder, `${title}.wav`)
      await copy(untagged, file)

      expect(await read(file)).toEqual({
        album: 'melodie-',
        albumartist: null,
        artist: null,
        artists: [],
        duration: 0,
        genre: [],
        title,
        year: null,
        cover: null,
        track: { no: null, of: null },
        disk: { no: null, of: null },
        movementIndex: {}
      })
    })

    it('reads album from parent folder', async () => {
      const album = faker.helpers.arrayElement([
        'Discovery',
        'Home Work',
        'Random Access Memories'
      ])
      const title = faker.helpers.arrayElement([
        'One More Time',
        'Harder, Better, Faster, Stronger',
        'Face To Face'
      ])
      const artist = faker.helpers.arrayElement(['Daft Punk', 'Phoenix'])
      const trackNo = faker.helpers.arrayElement([1, 5, 12])
      file = resolve(folder, album, `${trackNo}. ${artist} - ${title}.mp3`)
      await copy(untagged, file)
      expect(await read(file)).toEqual({
        album,
        albumartist: null,
        artist,
        artists: [],
        duration: 0.809795918367347,
        genre: [],
        title,
        year: null,
        cover: null,
        track: { no: trackNo, of: null },
        disk: { no: null, of: null },
        movementIndex: {}
      })
    })

    it('reads year and album from parent folder', async () => {
      const album = faker.helpers.arrayElement([
        'Discovery',
        'Home Work',
        'Random Access Memories'
      ])
      const title = faker.helpers.arrayElement([
        'One More Time',
        'Harder, Better, Faster, Stronger',
        'Face To Face'
      ])
      const artist = faker.helpers.arrayElement(['Daft Punk', 'Phoenix'])
      const trackNo = faker.helpers.arrayElement([1, 5, 12])
      const year = faker.helpers.arrayElement([1999, 2009, 2005])
      file = resolve(
        folder,
        `(${year}) ${album}`,
        `${trackNo}. ${artist} - ${title}.mp3`
      )
      await copy(untagged, file)
      expect(await read(file)).toEqual({
        album,
        albumartist: null,
        artist: artist,
        artists: [],
        duration: 0.809795918367347,
        genre: [],
        title,
        year,
        cover: null,
        track: { no: trackNo, of: null },
        disk: { no: null, of: null },
        movementIndex: {}
      })
    })
  })
})
