'use strict'

const mockOs = require('os')
const fs = require('fs-extra')
const { join, resolve } = require('path')
const engine = require('./search-engine')

jest.mock('electron', () => ({
  app: {
    getAppPath: jest.fn().mockReturnValue(mockOs.tmpDir())
  }
}))

const fixtures = resolve(__dirname, '..', '..', 'fixtures')
const indexPath = join(mockOs.tmpDir(), 'indices', 'tracks.json')

const riverside = {
  id: 2408127934,
  tags: {
    album: 'Philharmonics',
    artist: 'Agnes Obel',
    artists: ['Agnes Obel'],
    genre: ['Folk'],
    title: 'Riverside',
    year: 2010,
    track: {
      no: 2,
      of: 12
    },
    disk: {
      no: 1,
      of: null
    },
    averageLevel: 5243,
    label: ['PIAS']
  },
  cover:
    '/home/damien/Musique/Agnes Obel/(2010) Philharmonics, Vol. 1/cover.jpg',
  path:
    '/home/damien/Musique/Agnes Obel/(2010) Philharmonics, Vol. 1/02 - Agnes Obel - Riverside.mp3'
}

const justSo = {
  id: 1429226082,
  tags: {
    album: 'Philharmonics',
    artist: 'Agnes Obel',
    artists: ['Agnes Obel'],
    genre: ['Folk'],
    title: 'Just So',
    year: 2010,
    track: {
      no: 4,
      of: 12
    },
    disk: {
      no: 1,
      of: null
    },
    averageLevel: 3707,
    label: ['PIAS']
  },
  cover:
    '/home/damien/Musique/Agnes Obel/(2010) Philharmonics, Vol. 1/cover.jpg',
  path:
    '/home/damien/Musique/Agnes Obel/(2010) Philharmonics, Vol. 1/04 - Agnes Obel - Just So.mp3'
}

const fallingCatching = {
  id: 50739523,
  tags: {
    album: 'Philharmonics',
    artist: 'Agnes Obel',
    artists: ['Agnes Obel'],
    genre: ['Folk'],
    title: 'Falling, Catching',
    year: 2010,
    track: {
      no: 1,
      of: 12
    },
    disk: {
      no: 1,
      of: null
    },
    averageLevel: 3451,
    label: ['PIAS']
  },
  cover:
    '/home/damien/Musique/Agnes Obel/(2010) Philharmonics, Vol. 1/cover.jpg',
  path:
    '/home/damien/Musique/Agnes Obel/(2010) Philharmonics, Vol. 1/01 - Agnes Obel - Falling, Catching.mp3'
}

const allIReallyWant = {
  id: 1763482407,
  tags: {
    album: 'Jagged Little Pill',
    artist: 'Alanis Morissette',
    artists: ['Alanis Morissette'],
    genre: ['Pop'],
    title: 'All I really want',
    year: 1995,
    track: {
      no: 1,
      of: null
    },
    disk: {
      no: null,
      of: null
    },
    date: '1995'
  },
  cover:
    '/home/damien/Musique/Alanis Morissette/(1995) Jagged Little Pill/cover.jpg',
  path:
    '/home/damien/Musique/Alanis Morissette/(1995) Jagged Little Pill/01 - Alanis Morissette - All I really want.flac'
}

const notTheDoctor = {
  id: 1464738785,
  tags: {
    album: 'Jagged Little Pill',
    artist: 'Alanis Morissette',
    artists: ['Alanis Morissette'],
    genre: ['Pop'],
    title: 'Not the doctor',
    year: 1995,
    track: {
      no: 11,
      of: null
    },
    disk: {
      no: null,
      of: null
    },
    date: '1995'
  },
  cover:
    '/home/damien/Musique/Alanis Morissette/(1995) Jagged Little Pill/cover.jpg',
  path:
    '/home/damien/Musique/Alanis Morissette/(1995) Jagged Little Pill/11 - Alanis Morissette - Not the doctor.flac'
}

describe('Search engine', () => {
  beforeEach(engine.reset)

  describe('given no index', () => {
    beforeEach(async () => {
      try {
        await fs.unlink(indexPath)
      } catch {
        // ignore
      }
      await engine.init()
    })

    it('returns no album results', async () => {
      expect(
        await engine.searchBy('tags:album', allIReallyWant.tags.album)
      ).toEqual([])
    })

    it('adds new tracks and return results', async () => {
      await engine.add([fallingCatching, allIReallyWant])
      expect(
        await engine.searchBy('tags:album', fallingCatching.tags.album)
      ).toEqual([fallingCatching])
      expect(
        await engine.searchBy('tags:album', allIReallyWant.tags.album)
      ).toEqual([allIReallyWant])
    })
  })

  describe('given existing index', () => {
    beforeEach(async () => {
      await fs.copyFile(join(fixtures, 'valid-tracks.json'), indexPath)
      await engine.init()
    })

    it('returns album results', async () => {
      expect(
        await engine.searchBy('tags:album', fallingCatching.tags.album)
      ).toEqual([fallingCatching, justSo, riverside])
    })

    it('adds new tracks and return results', async () => {
      await engine.add([notTheDoctor])
      expect(
        await engine.searchBy('tags:album', allIReallyWant.tags.album)
      ).toEqual([notTheDoctor, allIReallyWant])
    })
  })
})
