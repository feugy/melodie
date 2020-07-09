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
    const name = faker.commerce.productName()

    await engine.add([{ path: faker.system.fileName(), tags: { album: name } }])

    expect((await engine.listAlbums()).find(n => n.name === name)).toEqual({
      name,
      id: hash(name)
    })
  })

  it('stores track with cover', async () => {
    const name = faker.commerce.productName()
    const image = faker.image.image()

    await engine.add([
      {
        path: faker.system.fileName(),
        tags: { album: name, artists: [] },
        cover: image
      }
    ])

    expect((await engine.listAlbums()).find(n => n.name === name)).toEqual({
      image,
      name,
      id: hash(name)
    })
  })

  describe('given multiple tracks', () => {
    it('skip existing albums', async () => {
      const name = faker.commerce.productName()
      const track1 = {
        path: faker.system.fileName(),
        tags: { album: name }
      }
      const track2 = {
        path: faker.system.fileName(),
        tags: { album: name }
      }
      const track3 = {
        path: faker.system.fileName(),
        tags: { album: name }
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
    const addId = obj => ({ ...obj, id: hash(obj.name) })

    const artists = [
      {
        name: faker.name.findName()
      },
      {
        name: faker.name.findName()
      }
    ].map(addId)

    const albums = [
      {
        name: faker.commerce.productName(),
        image: faker.image.image()
      },
      {
        name: faker.commerce.productName(),
        image: faker.image.image()
      }
    ].map(addId)

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
          tags: { album: albums[0].name.toUpperCase() }
        },
        {
          path: faker.system.fileName(),
          tags: { album: albums[1].name }
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
