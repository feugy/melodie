'use strict'

const { resolve } = require('path')
const engine = require('./tag-reader')

const fixtures = resolve(__dirname, '..', '..', 'fixtures')
const mp3 = resolve(fixtures, 'file.mp3')
const ogg = resolve(fixtures, 'file.ogg')
const flac = resolve(fixtures, 'file.flac')
const noDuration = resolve(fixtures, 'no-duration.mp3')

describe('Tag reader', () => {
  it('reads mp3 file', async () => {
    expect(await engine.read(mp3)).toEqual({
      album: 'Philharmonics',
      albumartist: null,
      artist: 'Agnes Obel',
      artists: ['Agnes Obel'],
      date: '2010',
      disk: {
        no: null,
        of: null
      },
      duration: 0.809795918367347,
      genre: ['Folk'],
      title: 'Falling, Catching',
      track: {
        no: 1,
        of: 12
      },
      year: 2010,
      movementIndex: {}
    })
  })

  it('reads flac file', async () => {
    expect(await engine.read(flac)).toEqual({
      album: 'Jagged Little Pill',
      albumartist: null,
      artist: 'Alanis Morissette',
      artists: ['Alanis Morissette'],
      date: '1995',
      disk: {
        no: null,
        of: null
      },
      duration: 2.640975056689342,
      genre: ['Pop'],
      title: 'All I really want',
      track: {
        no: 1,
        of: null
      },
      year: 1995,
      movementIndex: {}
    })
  })

  it('reads ogg file', async () => {
    expect(await engine.read(ogg)).toEqual({
      album: 'Dances With Wolves',
      albumartist: null,
      artist: 'John Barry',
      artists: ['John Barry'],
      date: '1990',
      disk: {
        no: null,
        of: null
      },
      duration: 2.4249433106575964,
      genre: ['Soundtrack'],
      title: 'Main Title - Looks Like A Suicide',
      track: {
        no: 1,
        of: null
      },
      year: 1990,
      movementIndex: {}
    })
  })

  it('reads duration when not returned in tags', async () => {
    expect(await engine.read(noDuration)).toEqual({
      album: 'By The Way',
      albumartist: 'Red Hot Chili Peppers',
      artist: 'Red Hot Chili Peppers',
      artists: ['Red Hot Chili Peppers'],
      averageLevel: 9083,
      comment: [''],
      composer: [''],
      copyright: '',
      disk: {
        no: null,
        of: null
      },
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
      track: {
        no: 1,
        of: 16
      },
      year: 2002,
      movementIndex: {}
    })
  })

  it('handles unknown file', async () => {
    expect(await engine.read(resolve(__dirname, 'unknown.file'))).toEqual({
      album: null,
      albumartist: null,
      artist: null,
      artists: [],
      duration: 0,
      genre: [],
      title: null,
      year: null
    })
  })

  it('handles unsupported file', async () => {
    expect(await engine.read(__filename)).toEqual({
      album: null,
      albumartist: null,
      artist: null,
      artists: [],
      duration: 0,
      genre: [],
      title: null,
      year: null
    })
  })
})
