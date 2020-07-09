'use strict'

const { resolve } = require('path')
const engine = require('./tag-reader')

const mp3 = resolve(__dirname, '..', '..', 'fixtures', 'file.mp3')
const ogg = resolve(__dirname, '..', '..', 'fixtures', 'file.ogg')
const flac = resolve(__dirname, '..', '..', 'fixtures', 'file.flac')

describe('Tag reader', () => {
  it('reads mp3 file', async () => {
    expect(await engine.read(mp3)).toEqual({
      album: 'Philharmonics',
      artist: 'Agnes Obel',
      artists: ['Agnes Obel'],
      date: '2010',
      disk: {
        no: null,
        of: null
      },
      genre: ['Folk'],
      title: 'Falling, Catching',
      track: {
        no: 1,
        of: 12
      },
      year: 2010
    })
  })

  it('reads flac file', async () => {
    expect(await engine.read(flac)).toEqual({
      album: 'Jagged Little Pill',
      artist: 'Alanis Morissette',
      artists: ['Alanis Morissette'],
      date: '1995',
      disk: {
        no: null,
        of: null
      },
      genre: ['Pop'],
      title: 'All I really want',
      track: {
        no: 1,
        of: null
      },
      year: 1995
    })
  })

  it('reads ogg file', async () => {
    expect(await engine.read(ogg)).toEqual({
      album: 'Dances With Wolves',
      artist: 'John Barry',
      artists: ['John Barry'],
      date: '1990',
      disk: {
        no: null,
        of: null
      },
      genre: ['Soundtrack'],
      title: 'Main Title - Looks Like A Suicide',
      track: {
        no: 1,
        of: null
      },
      year: 1990
    })
  })

  it('handles unknown file', async () => {
    expect(await engine.read(resolve(__dirname, 'unknown.file'))).toEqual({
      album: null,
      artist: null,
      artists: [],
      genre: [],
      title: null,
      year: null
    })
  })

  it('handles unsupported file', async () => {
    expect(await engine.read(__filename)).toEqual({
      album: null,
      artist: null,
      artists: [],
      genre: [],
      title: null,
      year: null
    })
  })
})
