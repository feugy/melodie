'use strict'

const faker = require('faker')
const fs = require('fs-extra')
const { join } = require('path')
const os = require('os')
const { artistsModel } = require('../models/artists')
const { albumsModel } = require('../models/albums')
const { tracksModel } = require('../models/tracks')
const { settingsModel } = require('../models/settings')
const engine = require('./list-engine')
const { hash, broadcast } = require('../utils')
const { sleep } = require('../tests')

jest.mock('../models/artists')
jest.mock('../models/albums')
jest.mock('../models/tracks')
jest.mock('../models/settings')
jest.mock('../utils/electron-remote')

function addId(obj) {
  return { ...obj, id: hash(obj.name) }
}

function makeRef(value) {
  return [hash(value), value]
}

function addRefs(track) {
  return {
    ...track,
    albumRef: track.tags.album ? makeRef(track.tags.album) : null,
    artistRefs: track.tags.artists.map(makeRef)
  }
}

let dbFile

describe('Lists Engine', () => {
  beforeAll(async () => {
    dbFile = join(await fs.mkdtemp(join(os.tmpdir(), 'melodie-')), 'db.sqlite3')
  })

  beforeEach(() => {
    jest.resetAllMocks()
    albumsModel.list.mockResolvedValue([])
    albumsModel.save.mockResolvedValue({ saved: [], removedIds: [] })
    artistsModel.list.mockResolvedValue([])
    artistsModel.save.mockResolvedValue({ saved: [], removedIds: [] })
    tracksModel.list.mockResolvedValue([])
    tracksModel.save.mockResolvedValue([])
  })

  describe('init', () => {
    it('initializes properly', async () => {
      await engine.init(dbFile)

      expect(settingsModel.init).toHaveBeenCalled()
      expect(albumsModel.init).toHaveBeenCalled()
      expect(artistsModel.init).toHaveBeenCalled()
      expect(tracksModel.init).toHaveBeenCalled()
    })
  })

  describe('reset', () => {
    it('resets properly', async () => {
      await engine.reset()

      expect(settingsModel.reset).toHaveBeenCalled()
      expect(albumsModel.reset).toHaveBeenCalled()
      expect(artistsModel.reset).toHaveBeenCalled()
      expect(tracksModel.reset).toHaveBeenCalled()
      expect(settingsModel.init).toHaveBeenCalled()
      expect(albumsModel.init).toHaveBeenCalled()
      expect(artistsModel.init).toHaveBeenCalled()
      expect(tracksModel.init).toHaveBeenCalled()
    })
  })

  describe('add', () => {
    it('stores track with multiple artists', async () => {
      const path = faker.system.fileName()
      const artistNames = [faker.name.findName(), faker.name.findName()]
      const artists = artistNames.map(name =>
        addId({
          name,
          trackIds: [hash(path)],
          refs: []
        })
      )
      const tracks = [{ id: hash(path), path, tags: { artists: artistNames } }]
      const savedTracks = tracks.map(addRefs)
      tracksModel.save.mockResolvedValue(
        savedTracks.map(current => ({ current }))
      )
      artistsModel.save.mockResolvedValueOnce({
        saved: artists,
        removedIds: []
      })

      await engine.add(tracks)

      expect(tracksModel.save).toHaveBeenCalledWith(tracks)
      expect(tracksModel.save).toHaveBeenCalledTimes(1)
      expect(artistsModel.save).toHaveBeenCalledWith(artists)
      expect(artistsModel.save).toHaveBeenCalledTimes(1)
      for (const artist of artists) {
        expect(broadcast).toHaveBeenCalledWith('artist-change', artist)
      }
      for (const track of savedTracks) {
        expect(broadcast).toHaveBeenCalledWith('track-change', track)
      }
      expect(broadcast).toHaveBeenCalledTimes(tracks.length + artists.length)
    })

    it('stores track with album', async () => {
      const name = faker.commerce.productName()
      const path = faker.system.fileName()
      const artists = [faker.name.findName(), faker.name.findName()]
      const tracks = [{ id: hash(path), path, tags: { album: name, artists } }]
      const savedTracks = tracks.map(addRefs)
      tracksModel.save.mockResolvedValue(
        savedTracks.map(current => ({ current }))
      )
      const album = addId({
        name,
        trackIds: [hash(path)],
        refs: savedTracks[0].artistRefs
      })
      albumsModel.save.mockResolvedValueOnce({
        saved: [album],
        removedIds: []
      })

      await engine.add(tracks)

      expect(tracksModel.save).toHaveBeenCalledWith(tracks)
      expect(tracksModel.save).toHaveBeenCalledTimes(1)
      expect(albumsModel.save).toHaveBeenCalledWith([album])
      expect(albumsModel.save).toHaveBeenCalledTimes(1)
      expect(broadcast).toHaveBeenCalledWith('album-change', album)
      for (const track of savedTracks) {
        expect(broadcast).toHaveBeenCalledWith('track-change', track)
      }
      expect(broadcast).toHaveBeenCalledTimes(tracks.length + 1)
    })

    it('stores track with cover', async () => {
      const name = faker.commerce.productName()
      const media = faker.image.image()
      const path = faker.system.fileName()
      const album = addId({
        name,
        media,
        trackIds: [hash(path)],
        refs: []
      })
      const tracks = [
        {
          id: hash(path),
          path,
          tags: { album: name, artists: [] },
          media
        }
      ]
      const savedTracks = tracks.map(addRefs)
      tracksModel.save.mockResolvedValue(
        savedTracks.map(current => ({ current }))
      )
      albumsModel.save.mockResolvedValueOnce({
        saved: [album],
        removedIds: []
      })

      await engine.add(tracks)

      expect(tracksModel.save).toHaveBeenCalledWith(tracks)
      expect(tracksModel.save).toHaveBeenCalledTimes(1)
      expect(albumsModel.save).toHaveBeenCalledWith([album])
      expect(albumsModel.save).toHaveBeenCalledTimes(1)
      expect(broadcast).toHaveBeenCalledWith('album-change', album)
      for (const track of savedTracks) {
        expect(broadcast).toHaveBeenCalledWith('track-change', track)
      }
      expect(broadcast).toHaveBeenCalledTimes(tracks.length + 1)
    })

    it('skip existing albums', async () => {
      const name = faker.commerce.productName()
      const artist1 = faker.name.findName()
      const artist2 = faker.name.findName()
      const track1 = {
        path: faker.system.fileName(),
        tags: { album: name, artists: [artist1] }
      }
      track1.id = hash(track1.path)
      const track2 = {
        path: faker.system.fileName(),
        tags: { album: name, artists: [artist2] }
      }
      track2.id = hash(track2.path)
      const track3 = {
        path: faker.system.fileName(),
        tags: { album: name, artists: [artist2] }
      }
      track3.id = hash(track3.path)

      const album = addId({
        name,
        trackIds: [track1.id, track2.id, track3.id],
        refs: [makeRef(artist1), makeRef(artist2)]
      })
      const tracks = [track1, track2, track3]
      const savedTracks = tracks.map(addRefs)
      tracksModel.save.mockResolvedValue(
        savedTracks.map(current => ({ current }))
      )
      albumsModel.save.mockResolvedValueOnce({
        saved: [album],
        removedIds: []
      })

      await engine.add(tracks)

      expect(tracksModel.save).toHaveBeenCalledWith(tracks)
      expect(tracksModel.save).toHaveBeenCalledTimes(1)
      expect(albumsModel.save).toHaveBeenCalledWith([album])
      expect(albumsModel.save).toHaveBeenCalledTimes(1)
      expect(broadcast).toHaveBeenCalledWith('album-change', album)
      for (const track of savedTracks) {
        expect(broadcast).toHaveBeenCalledWith('track-change', track)
      }
      expect(broadcast).toHaveBeenCalledTimes(tracks.length + 1)
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

      const artists = [
        addId({
          name: artist1,
          trackIds: [track1.id],
          refs: []
        }),
        addId({
          name: artist2,
          trackIds: [track1.id, track2.id],
          refs: []
        }),
        addId({
          name: artist3,
          trackIds: [track2.id, track3.id],
          refs: []
        })
      ]
      const tracks = [track1, track2, track3]
      const savedTracks = tracks.map(addRefs)
      tracksModel.save.mockResolvedValue(
        savedTracks.map(current => ({ current }))
      )
      artistsModel.save.mockResolvedValueOnce({
        saved: artists,
        removedIds: []
      })

      await engine.add(tracks)

      expect(tracksModel.save).toHaveBeenCalledWith(tracks)
      expect(tracksModel.save).toHaveBeenCalledTimes(1)
      expect(artistsModel.save).toHaveBeenCalledWith(artists)
      expect(artistsModel.save).toHaveBeenCalledTimes(1)
      for (const artist of artists) {
        expect(broadcast).toHaveBeenCalledWith('artist-change', artist)
      }
      for (const track of savedTracks) {
        expect(broadcast).toHaveBeenCalledWith('track-change', track)
      }
      expect(broadcast).toHaveBeenCalledTimes(tracks.length + artists.length)
    })

    it('detects album changes for existing tracks', async () => {
      const oldName = faker.commerce.productName()
      const updatedName = faker.commerce.productName()
      const newName = faker.commerce.productName()
      const artist1 = faker.name.findName()
      const artist2 = faker.name.findName()
      const artist3 = faker.name.findName()

      const track1 = {
        path: faker.system.fileName(),
        tags: { album: newName, artists: [artist2] }
      }
      track1.id = hash(track1.path)
      const track2 = {
        path: faker.system.fileName(),
        tags: { album: newName, artists: [artist1] }
      }
      track2.id = hash(track2.path)
      const track3 = {
        path: faker.system.fileName(),
        tags: { album: newName, artists: [artist1, artist2] }
      }
      track3.id = hash(track3.path)
      const track4 = {
        path: faker.system.fileName(),
        tags: { album: updatedName, artists: [artist3] }
      }
      track4.id = hash(track4.path)

      const tracks = [track1, track2, track3, track4]
      const savedTracks = tracks.map(addRefs)
      tracksModel.save.mockResolvedValue([
        {
          current: savedTracks[0],
          previous: addRefs({
            id: track1.id,
            tags: { album: oldName, artists: [artist1] }
          })
        },
        {
          current: savedTracks[1],
          previous: addRefs({
            id: track2.id,
            tags: { album: oldName, artists: [artist3] }
          })
        },
        {
          current: savedTracks[2],
          previous: addRefs({
            id: track3.id,
            tags: { album: updatedName, artists: [artist1, artist2] }
          })
        },
        { current: savedTracks[3] }
      ])

      const oldAlbum = addId({
        name: oldName,
        trackIds: [],
        removedTrackIds: [track1.id, track2.id],
        refs: [],
        removedRefs: [makeRef(artist1), makeRef(artist3)]
      })

      const updatedAlbum = addId({
        name: updatedName,
        removedTrackIds: [track3.id],
        trackIds: [track4.id],
        refs: [makeRef(artist3)],
        removedRefs: [makeRef(artist1), makeRef(artist2)]
      })

      const newAlbum = addId({
        name: newName,
        trackIds: [track1.id, track2.id, track3.id],
        refs: [makeRef(artist2), makeRef(artist1)]
      })

      albumsModel.save.mockResolvedValueOnce({
        saved: [oldAlbum, updatedAlbum, newAlbum],
        removedIds: []
      })

      await engine.add(tracks)

      expect(tracksModel.save).toHaveBeenCalledWith(tracks)
      expect(tracksModel.save).toHaveBeenCalledTimes(1)
      expect(albumsModel.save).toHaveBeenCalledWith([
        newAlbum,
        oldAlbum,
        updatedAlbum
      ])
      expect(albumsModel.save).toHaveBeenCalledTimes(1)
      expect(broadcast).toHaveBeenCalledWith('album-change', oldAlbum)
      expect(broadcast).toHaveBeenCalledWith('album-change', updatedAlbum)
      expect(broadcast).toHaveBeenCalledWith('album-change', newAlbum)
      for (const track of savedTracks) {
        expect(broadcast).toHaveBeenCalledWith('track-change', track)
      }
      expect(broadcast).toHaveBeenCalledTimes(tracks.length + 3)
    })

    it('detects artist changes for existing tracks', async () => {
      const oldName = faker.name.findName()
      const updatedName = faker.name.findName()
      const newName = faker.name.findName()

      const track1 = {
        path: faker.system.fileName(),
        tags: { artists: [newName, updatedName] }
      }
      track1.id = hash(track1.path)
      const track2 = {
        path: faker.system.fileName(),
        tags: { artists: [newName] }
      }
      track2.id = hash(track2.path)

      const tracks = [track1, track2]
      const savedTracks = tracks.map(addRefs)
      tracksModel.save.mockResolvedValue([
        {
          current: savedTracks[0],
          previous: addRefs({ id: track1.id, tags: { artists: [oldName] } })
        },
        {
          current: savedTracks[1],
          previous: addRefs({
            id: track2.id,
            tags: { artists: [oldName, updatedName] }
          })
        }
      ])

      const oldArtist = addId({
        name: oldName,
        trackIds: [],
        removedTrackIds: [track1.id, track2.id],
        removedRefs: [],
        refs: []
      })
      const updatedArtist = addId({
        name: updatedName,
        removedTrackIds: [track2.id],
        trackIds: [track1.id],
        removedRefs: [],
        refs: []
      })
      const newArtist = addId({
        name: newName,
        trackIds: [track1.id, track2.id],
        refs: []
      })
      artistsModel.save.mockResolvedValueOnce({
        saved: [oldArtist, updatedArtist, newArtist],
        removedIds: []
      })

      await engine.add(tracks)

      expect(artistsModel.save).toHaveBeenCalledWith([
        newArtist,
        updatedArtist,
        oldArtist
      ])
      expect(artistsModel.save).toHaveBeenCalledTimes(1)
      expect(broadcast).toHaveBeenCalledWith('artist-change', oldArtist)
      expect(broadcast).toHaveBeenCalledWith('artist-change', updatedArtist)
      expect(broadcast).toHaveBeenCalledWith('artist-change', newArtist)
      for (const track of savedTracks) {
        expect(broadcast).toHaveBeenCalledWith('track-change', track)
      }
      expect(broadcast).toHaveBeenCalledTimes(5)
    })
  })

  describe('remove', () => {
    it('updates album', async () => {
      const name = faker.commerce.productName()
      const path = faker.system.fileName()
      const artists = [faker.name.findName(), faker.name.findName()]

      const album = addId({
        name,
        removedTrackIds: [hash(path)],
        trackIds: [],
        refs: [],
        removedRefs: artists.map(makeRef)
      })
      const tracks = [
        addRefs({
          id: hash(path),
          path,
          tags: { album: name, artists }
        })
      ]
      const trackIds = tracks.map(({ id }) => id)
      tracksModel.removeByIds.mockResolvedValueOnce(tracks)

      albumsModel.save.mockResolvedValueOnce({
        saved: [],
        removedIds: [album.id]
      })

      await engine.remove(trackIds)
      await sleep(200)

      expect(tracksModel.removeByIds).toHaveBeenCalledWith(trackIds)
      expect(tracksModel.removeByIds).toHaveBeenCalledTimes(1)
      expect(albumsModel.save).toHaveBeenCalledWith([album])
      expect(albumsModel.save).toHaveBeenCalledTimes(1)

      expect(broadcast).toHaveBeenCalledWith('album-removal', album.id)
      for (const id of trackIds) {
        expect(broadcast).toHaveBeenCalledWith('track-removal', id)
      }
      expect(broadcast).toHaveBeenCalledTimes(tracks.length + 1)
    })

    it('updates artists', async () => {
      const path = faker.system.fileName()
      const artistNames = [faker.name.findName(), faker.name.findName()]
      const artists = artistNames.map(name =>
        addId({
          name,
          removedTrackIds: [hash(path)],
          trackIds: [],
          refs: [],
          removedRefs: []
        })
      )
      const tracks = [
        addRefs({ id: hash(path), path, tags: { artists: artistNames } })
      ]
      const trackIds = tracks.map(({ id }) => id)
      tracksModel.removeByIds.mockResolvedValueOnce(tracks)
      artistsModel.save.mockResolvedValueOnce({
        saved: [],
        removedIds: artists.map(({ id }) => id)
      })

      await engine.remove(trackIds)
      await sleep(200)

      expect(tracksModel.removeByIds).toHaveBeenCalledWith(trackIds)
      expect(tracksModel.removeByIds).toHaveBeenCalledTimes(1)
      expect(artistsModel.save).toHaveBeenCalledWith(artists)
      expect(artistsModel.save).toHaveBeenCalledTimes(1)

      for (const { id } of artists) {
        expect(broadcast).toHaveBeenCalledWith('artist-removal', id)
      }
      for (const id of trackIds) {
        expect(broadcast).toHaveBeenCalledWith('track-removal', id)
      }
      expect(broadcast).toHaveBeenCalledTimes(tracks.length + artists.length)
    })

    it('sends changes before removals', async () => {
      const path1 = faker.system.fileName()
      const path2 = faker.system.fileName()
      const artistNames = [faker.name.findName(), faker.name.findName()]
      const artists = [
        addId({
          name: artistNames[0],
          removedTrackIds: [hash(path1), hash(path2)],
          trackIds: [],
          refs: [],
          removedRefs: []
        }),
        addId({
          name: artistNames[1],
          removedTrackIds: [hash(path1)],
          trackIds: [],
          refs: [],
          removedRefs: []
        })
      ]
      const tracks = [
        addRefs({
          id: hash(path1),
          path: path1,
          tags: { artists: artistNames }
        }),
        addRefs({
          id: hash(path2),
          path: path2,
          tags: { artists: artistNames.slice(0, 1) }
        })
      ]
      const trackIds = tracks.map(({ id }) => id)

      tracksModel.removeByIds.mockResolvedValueOnce(tracks)
      artistsModel.save.mockResolvedValueOnce({
        saved: [artists[0].id],
        removedIds: [artists[1].id]
      })

      await engine.remove(trackIds)
      await sleep(200)

      expect(tracksModel.removeByIds).toHaveBeenCalledWith(trackIds)
      expect(tracksModel.removeByIds).toHaveBeenCalledTimes(1)
      expect(artistsModel.save).toHaveBeenCalledWith(artists)
      expect(artistsModel.save).toHaveBeenCalledTimes(1)

      expect(broadcast).toHaveBeenNthCalledWith(
        1,
        'track-removal',
        tracks[0].id
      )
      expect(broadcast).toHaveBeenNthCalledWith(
        2,
        'track-removal',
        tracks[1].id
      )
      expect(broadcast).toHaveBeenNthCalledWith(
        3,
        'artist-change',
        artists[0].id
      )
      expect(broadcast).toHaveBeenNthCalledWith(
        4,
        'artist-removal',
        artists[1].id
      )
      expect(broadcast).toHaveBeenCalledTimes(4)
    })
  })

  describe('list', () => {
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
})

describe('fetchWithTracks', () => {
  beforeEach(() => jest.resetAllMocks())

  it('returns album with tracks, order by track number, single disc', async () => {
    const track1 = {
      path: faker.system.fileName(),
      tags: { track: { no: 3 }, disk: {} }
    }
    track1.id = hash(track1.path)
    const track2 = {
      path: faker.system.fileName(),
      tags: { track: { no: undefined }, disk: {} }
    }
    track2.id = hash(track2.path)
    const track3 = {
      path: faker.system.fileName(),
      tags: { track: { no: 1 }, disk: {} }
    }
    track3.id = hash(track3.path)
    const name = faker.commerce.productName()
    const album = {
      id: hash(name),
      name,
      trackIds: [track1.id, track2.id, track3.id]
    }

    albumsModel.getById.mockResolvedValueOnce(album)
    tracksModel.getByIds.mockResolvedValueOnce([track1, track2, track3])
    expect(await engine.fetchWithTracks('album', album.id)).toEqual({
      ...album,
      tracks: [track3, track1, track2]
    })
    expect(artistsModel.getById).not.toHaveBeenCalled()
  })

  it('returns album with tracks, order by track number, multiple discs', async () => {
    const track1 = {
      path: faker.system.fileName(),
      tags: { track: { no: 3 }, disk: { no: 2 } }
    }
    track1.id = hash(track1.path)
    const track2 = {
      path: faker.system.fileName(),
      tags: { track: { no: 1 }, disk: { no: 1 } }
    }
    track2.id = hash(track2.path)
    const track3 = {
      path: faker.system.fileName(),
      tags: { track: { no: 2 }, disk: { no: undefined } }
    }
    track3.id = hash(track3.path)
    const track4 = {
      path: faker.system.fileName(),
      tags: { track: { no: 1 }, disk: { no: 2 } }
    }
    track4.id = hash(track4.path)

    const name = faker.commerce.productName()
    const album = {
      id: hash(name),
      name,
      trackIds: [track1.id, track2.id, track3.id, track4.id]
    }

    albumsModel.getById.mockResolvedValueOnce(album)
    tracksModel.getByIds.mockResolvedValueOnce([track1, track2, track3, track4])
    expect(await engine.fetchWithTracks('album', album.id)).toEqual({
      ...album,
      tracks: [track2, track4, track1, track3]
    })
    expect(artistsModel.getById).not.toHaveBeenCalled()
  })

  it('returns album with tracks, order by list rank', async () => {
    const track1 = {
      path: faker.system.fileName(),
      tags: { track: { no: 3 }, disk: { no: 2 } }
    }
    track1.id = hash(track1.path)
    const track2 = {
      path: faker.system.fileName(),
      tags: { track: { no: 1 }, disk: { no: 1 } }
    }
    track2.id = hash(track2.path)
    const track3 = {
      path: faker.system.fileName(),
      tags: { track: { no: 2 }, disk: { no: undefined } }
    }

    const name = faker.commerce.productName()
    const album = {
      id: hash(name),
      name,
      trackIds: [track3.id, track2.id, track1.id]
    }

    albumsModel.getById.mockResolvedValueOnce(album)
    tracksModel.getByIds.mockResolvedValueOnce([track1, track2, track3])
    expect(await engine.fetchWithTracks('album', album.id, 'rank')).toEqual({
      ...album,
      tracks: [track3, track2, track1]
    })
    expect(artistsModel.getById).not.toHaveBeenCalled()
  })

  it('returns artists with tracks', async () => {
    const track1 = {
      path: faker.system.fileName(),
      tags: { track: { no: 3 }, disk: {} }
    }
    track1.id = hash(track1.path)
    const track2 = {
      path: faker.system.fileName(),
      tags: { track: { no: undefined }, disk: {} }
    }
    track2.id = hash(track2.path)
    const track3 = {
      path: faker.system.fileName(),
      tags: { track: { no: 1 }, disk: {} }
    }
    track3.id = hash(track3.path)
    const name = faker.commerce.productName()
    const artist = {
      id: hash(name),
      name,
      trackIds: [track1.id, track2.id, track3.id]
    }

    artistsModel.getById.mockResolvedValueOnce(artist)
    tracksModel.getByIds.mockResolvedValueOnce([track1, track2, track3])
    expect(await engine.fetchWithTracks('artist', artist.id)).toEqual({
      ...artist,
      tracks: [track3, track1, track2]
    })
    expect(albumsModel.getById).not.toHaveBeenCalled()
  })

  it('handles missing list', async () => {
    const track1 = {
      path: faker.system.fileName(),
      tags: { track: { no: 3 }, disk: {} }
    }
    track1.id = hash(track1.path)
    const track2 = {
      path: faker.system.fileName(),
      tags: { track: { no: undefined }, disk: {} }
    }
    track2.id = hash(track2.path)
    const track3 = {
      path: faker.system.fileName(),
      tags: { track: { no: 1 }, disk: {} }
    }
    track3.id = hash(track3.path)
    const name = faker.commerce.productName()
    const artist = {
      id: hash(name),
      name,
      trackIds: [track1.id, track2.id, track3.id]
    }

    artistsModel.getById.mockResolvedValueOnce(null)
    expect(await engine.fetchWithTracks('artist', artist.id)).toEqual(null)
    expect(albumsModel.getById).not.toHaveBeenCalled()
    expect(tracksModel.getByIds).not.toHaveBeenCalled()
  })

  describe('search', () => {
    it('returns a mix of matching albums, artists and tracks', async () => {
      const searched = faker.lorem.words()
      const album1 = addId({
        name: faker.commerce.productName(),
        trackIds: [],
        refs: []
      })
      const album2 = addId({
        name: faker.commerce.productName(),
        trackIds: [],
        refs: []
      })
      const artist1 = addId({
        name: faker.commerce.productName(),
        trackIds: [],
        refs: []
      })
      const artist2 = addId({
        name: faker.commerce.productName(),
        trackIds: [],
        refs: []
      })
      const track1 = {
        path: faker.system.fileName(),
        tags: {}
      }
      track1.id = hash(track1.path)
      const track2 = {
        path: faker.system.fileName(),
        tags: {}
      }
      track2.id = hash(track2.path)
      const size = 2
      const from = 0
      albumsModel.list.mockResolvedValue({
        results: [album1, album2],
        total: 3,
        size,
        from
      })
      artistsModel.list.mockResolvedValue({
        results: [artist1, artist2],
        total: 2,
        size,
        from
      })
      tracksModel.list.mockResolvedValue({
        results: [track1, track2],
        total: 5,
        size,
        from
      })

      const results = await engine.search(searched)

      expect(results.albums).toEqual([album1, album2])
      expect(results.artists).toEqual([artist1, artist2])
      expect(results.tracks).toEqual([track1, track2])
      expect(results.size).toEqual(size)
      expect(results.from).toEqual(from)
      expect(results.totalSum).toEqual(10)
      expect(results.totals).toEqual({ albums: 3, artists: 2, tracks: 5 })
      expect(albumsModel.list).toHaveBeenCalledWith({
        searched
      })
      expect(artistsModel.list).toHaveBeenCalledWith({
        searched
      })
      expect(tracksModel.list).toHaveBeenCalledWith({
        searched
      })
    })

    it('can returns empty results', async () => {
      const searched = faker.lorem.words()
      const size = 10
      const from = 0
      albumsModel.list.mockResolvedValue({ results: [], total: 0, size, from })
      artistsModel.list.mockResolvedValue({ results: [], total: 0, size, from })
      tracksModel.list.mockResolvedValue({ results: [], total: 0, size, from })

      const results = await engine.search(searched)

      expect(results.albums).toEqual([])
      expect(results.artists).toEqual([])
      expect(results.tracks).toEqual([])
      expect(results.size).toEqual(size)
      expect(results.from).toEqual(from)
      expect(results.totalSum).toEqual(0)
      expect(results.totals).toEqual({ albums: 0, artists: 0, tracks: 0 })
      expect(albumsModel.list).toHaveBeenCalledWith({
        searched
      })
      expect(artistsModel.list).toHaveBeenCalledWith({
        searched
      })
      expect(tracksModel.list).toHaveBeenCalledWith({
        searched
      })
    })

    it('cherry picks pagination critiera', async () => {
      const searched = faker.lorem.words()
      const size = 20
      const from = 10
      albumsModel.list.mockResolvedValue({ results: [], total: 0, size, from })
      artistsModel.list.mockResolvedValue({ results: [], total: 0, size, from })
      tracksModel.list.mockResolvedValue({ results: [], total: 0, size, from })

      const results = await engine.search(searched, {
        size,
        from,
        sort: '-unused',
        searched: 'unused'
      })

      expect(results.albums).toEqual([])
      expect(results.artists).toEqual([])
      expect(results.tracks).toEqual([])
      expect(results.size).toEqual(size)
      expect(results.from).toEqual(from)
      expect(results.totalSum).toEqual(0)
      expect(results.totals).toEqual({ albums: 0, artists: 0, tracks: 0 })
      expect(albumsModel.list).toHaveBeenCalledWith({
        searched,
        size,
        from
      })
      expect(artistsModel.list).toHaveBeenCalledWith({
        searched,
        size,
        from
      })
      expect(tracksModel.list).toHaveBeenCalledWith({
        searched,
        size,
        from
      })
    })
  })
})
