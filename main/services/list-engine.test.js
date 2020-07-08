'use strict'

const faker = require('faker')
const mockOs = require('os')
const engine = require('./list-engine')
const fs = require('fs-extra')
const { join } = require('path')
const { hash } = require('../utils')

jest.mock('electron', () => ({
  app: {
    getAppPath: jest.fn().mockReturnValue(mockOs.tmpdir())
  }
}))

describe('Lists Engine', () => {
  beforeEach(engine.reset)

  it('initialize properly', async () => {
    await engine.init()
    expect(await engine.listArtists()).toEqual([])
    expect(await engine.listAlbums()).toEqual([])
  })

  it('stores track with multiple artists', async () => {
    const artists = [faker.name.findName(), faker.name.findName()]

    await engine.add([{ path: faker.system.fileName(), tags: { artists } }])
    const result = await engine.listArtists()

    for (const name of artists) {
      expect(result.find(n => n.name === name)).toEqual({
        name,
        id: hash(name)
      })
    }
  })

  it('stores track with album', async () => {
    const title = faker.commerce.productName()

    await engine.add([
      { path: faker.system.fileName(), tags: { album: title } }
    ])

    expect((await engine.listAlbums()).find(n => n.title === title)).toEqual({
      title,
      id: hash(title)
    })
  })

  it('stores track with cover', async () => {
    const title = faker.commerce.productName()
    const cover = faker.image.image()

    await engine.add([
      {
        path: faker.system.fileName(),
        tags: { album: title, artists: [] },
        cover
      }
    ])

    expect((await engine.listAlbums()).find(n => n.title === title)).toEqual({
      cover,
      title,
      id: hash(title)
    })
  })

  describe('given multiple tracks', () => {
    it('skip existing albums', async () => {
      const title = faker.commerce.productName()
      const track1 = {
        path: faker.system.fileName(),
        tags: { album: title }
      }
      const track2 = {
        path: faker.system.fileName(),
        tags: { album: title }
      }
      const track3 = {
        path: faker.system.fileName(),
        tags: { album: title }
      }

      await engine.add([track1, track2, track3])

      expect(await engine.listAlbums()).toHaveLength(1)
    })

    it('skip existing artists', async () => {
      const artist1 = faker.name.findName()
      const artist2 = faker.name.findName()
      const artist3 = faker.name.findName()
      const track1 = {
        path: faker.system.fileName(),
        tags: { artists: [artist1, artist2] }
      }
      const track2 = {
        path: faker.system.fileName(),
        tags: { artists: [artist2, artist3] }
      }
      const track3 = {
        path: faker.system.fileName(),
        tags: { artists: [artist3] }
      }

      await engine.add([track1, track2, track3])

      expect(await engine.listArtists()).toHaveLength(3)
    })
  })

  describe('given existing indices', () => {
    const artists = [
      {
        name: faker.name.findName()
      },
      {
        name: faker.name.findName()
      }
    ].map(artist => ({ ...artist, id: hash(artist.name) }))

    const albums = [
      {
        title: faker.commerce.productName(),
        cover: faker.image.image()
      },
      {
        title: faker.commerce.productName(),
        cover: faker.image.image()
      }
    ].map(album => ({ ...album, id: hash(album.title) }))

    const artistsFile = join(mockOs.tmpdir(), 'indices', 'artists.json')
    const albumsFile = join(mockOs.tmpdir(), 'indices', 'albums.json')

    beforeEach(async () => {
      await fs.ensureFile(artistsFile)
      await fs.writeFile(artistsFile, JSON.stringify(artists))
      await fs.ensureFile(albumsFile)
      await fs.writeFile(albumsFile, JSON.stringify(albums))
      await engine.init()
    })

    it('loads them', async () => {
      expect(await engine.listAlbums()).toEqual(albums)
      expect(await engine.listArtists()).toEqual(artists)
    })

    it('ignores corrupted ones', async () => {
      await fs.writeFile(albumsFile, '[{"corrupted":true')
      await engine.init()
      expect(await engine.listAlbums()).toEqual([])
      expect(await engine.listArtists()).toEqual(artists)
    })

    it('skip existing albums', async () => {
      await engine.add([
        {
          path: faker.system.fileName(),
          tags: { album: faker.commerce.productName() }
        },
        {
          path: faker.system.fileName(),
          tags: { album: albums[0].title.toUpperCase() }
        },
        {
          path: faker.system.fileName(),
          tags: { album: albums[1].title }
        }
      ])

      expect(await engine.listAlbums()).toHaveLength(albums.length + 1)
    })

    it('skip existing artists', async () => {
      await engine.add([
        {
          path: faker.system.fileName(),
          tags: { artists: [faker.name.findName()] }
        },
        {
          path: faker.system.fileName(),
          tags: { artists: [artists[0].name.toLowerCase()] }
        },
        {
          path: faker.system.fileName(),
          tags: { artists: [artists[1].name] }
        }
      ])

      expect(await engine.listArtists()).toHaveLength(artists.length + 1)
    })
  })
})
