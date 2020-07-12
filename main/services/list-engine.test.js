'use strict'

const faker = require('faker')
const fs = require('fs-extra')
const { join } = require('path')
const os = require('os')
const { artistsModel } = require('../models/artists')
const { albumsModel } = require('../models/albums')
const { tracksModel } = require('../models/tracks')
const engine = require('./list-engine')
const { hash } = require('../utils')

jest.mock('../models/artists')
jest.mock('../models/albums')
jest.mock('../models/tracks')
jest.mock('electron', () => ({ app: { getAppPath: jest.fn() } }))

albumsModel.list.mockResolvedValue([])
artistsModel.list.mockResolvedValue([])
tracksModel.list.mockResolvedValue([])

function addId(obj) {
  return { ...obj, id: hash(obj.name) }
}

let dbFile

describe('Lists Engine', () => {
  beforeAll(async () => {
    dbFile = join(await fs.mkdtemp(join(os.tmpdir(), 'melodie-')), 'db.sqlite3')
  })

  beforeEach(() => jest.clearAllMocks())

  it('initializes properly', async () => {
    await engine.init(dbFile)

    expect(albumsModel.init).toHaveBeenCalled()
    expect(artistsModel.init).toHaveBeenCalled()
    expect(tracksModel.init).toHaveBeenCalled()
  })

  it('resets properly', async () => {
    await engine.reset()

    expect(albumsModel.reset).toHaveBeenCalled()
    expect(artistsModel.reset).toHaveBeenCalled()
    expect(tracksModel.reset).toHaveBeenCalled()
    expect(albumsModel.init).toHaveBeenCalled()
    expect(artistsModel.init).toHaveBeenCalled()
    expect(tracksModel.init).toHaveBeenCalled()
  })

  it('stores track with multiple artists', async () => {
    const artists = [faker.name.findName(), faker.name.findName()]
    const path = faker.system.fileName()

    await engine.add([{ id: hash(path), path, tags: { artists } }])

    for (const name of artists) {
      expect(artistsModel.save).toHaveBeenCalledWith(
        addId({
          name,
          trackIds: [hash(path)]
        })
      )
    }
    expect(artistsModel.save).toHaveBeenCalledTimes(artists.length)
  })

  it('stores track with album', async () => {
    const name = faker.commerce.productName()
    const path = faker.system.fileName()

    await engine.add([{ id: hash(path), path, tags: { album: name } }])
    expect(albumsModel.save).toHaveBeenCalledWith(
      addId({
        id: hash(name),
        name,
        trackIds: [hash(path)]
      })
    )
    expect(albumsModel.save).toHaveBeenCalledTimes(1)
  })

  it('stores track with cover', async () => {
    const name = faker.commerce.productName()
    const media = faker.image.image()
    const path = faker.system.fileName()

    await engine.add([
      {
        id: hash(path),
        path,
        tags: { album: name, artists: [] },
        media
      }
    ])
    expect(albumsModel.save).toHaveBeenCalledWith(
      addId({
        name,
        media,
        trackIds: [hash(path)]
      })
    )
    expect(albumsModel.save).toHaveBeenCalledTimes(1)
  })

  it('returns all artists', async () => {
    const artists = [
      {
        name: faker.name.findName()
      },
      {
        name: faker.name.findName()
      }
    ].map(addId)
    artistsModel.list.mockResolvedValueOnce(artists)
    expect(await engine.listArtists()).toEqual(artists)
  })

  it('returns all albums', async () => {
    const albums = [
      {
        name: faker.commerce.productName(),
        media: faker.image.image()
      },
      {
        name: faker.commerce.productName(),
        media: faker.image.image()
      }
    ].map(addId)
    albumsModel.list.mockResolvedValueOnce(albums)
    expect(await engine.listAlbums()).toEqual(albums)
  })

  it('returns tracks by list', async () => {
    const track1 = {
      path: faker.system.fileName()
    }
    track1.id = hash(track1.path)
    const track2 = {
      path: faker.system.fileName()
    }
    track2.id = hash(track2.path)
    const track3 = {
      path: faker.system.fileName()
    }
    track3.id = hash(track3.path)
    const name = faker.commerce.productName()
    const album = {
      id: hash(name),
      name,
      trackIds: [track1.id, track2.id, track3.id]
    }

    tracksModel.getByIds.mockResolvedValueOnce([track1, track2, track3])
    expect(await engine.listTracksOf(album)).toEqual([track1, track2, track3])
  })

  describe('given multiple tracks', () => {
    it('skip existing albums', async () => {
      const name = faker.commerce.productName()
      const track1 = {
        path: faker.system.fileName(),
        tags: { album: name }
      }
      track1.id = hash(track1.path)
      const track2 = {
        path: faker.system.fileName(),
        tags: { album: name }
      }
      track2.id = hash(track2.path)
      const track3 = {
        path: faker.system.fileName(),
        tags: { album: name }
      }
      track3.id = hash(track3.path)

      await engine.add([track1, track2, track3])

      expect(albumsModel.save).toHaveBeenCalledWith(
        addId({
          name,
          trackIds: [track1.id, track2.id, track3.id]
        })
      )
      expect(albumsModel.save).toHaveBeenCalledTimes(1)
    })

    it('skip existing artists', async () => {
      const artist1 = faker.name.findName()
      const artist2 = faker.name.findName()
      const artist3 = faker.name.findName()
      const track1 = {
        path: faker.system.fileName(),
        tags: { artists: [artist1, artist2] }
      }
      track1.id = hash(track1.path)
      const track2 = {
        path: faker.system.fileName(),
        tags: { artists: [artist2, artist3] }
      }
      track2.id = hash(track2.path)
      const track3 = {
        path: faker.system.fileName(),
        tags: { artists: [artist3] }
      }
      track3.id = hash(track3.path)

      await engine.add([track1, track2, track3])

      expect(artistsModel.save).toHaveBeenCalledWith(
        addId({
          name: artist1,
          trackIds: [track1.id]
        })
      )
      expect(artistsModel.save).toHaveBeenCalledWith(
        addId({
          name: artist2,
          trackIds: [track1.id, track2.id]
        })
      )
      expect(artistsModel.save).toHaveBeenCalledWith(
        addId({
          name: artist3,
          trackIds: [track2.id, track3.id]
        })
      )
      expect(artistsModel.save).toHaveBeenCalledTimes(3)
    })
  })
})
