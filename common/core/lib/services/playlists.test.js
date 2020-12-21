'use strict'

const { extname } = require('path')
const faker = require('faker')
const { playlistsModel } = require('../models/playlists')
const { tracksModel } = require('../models/tracks')
const playlistsService = require('./playlists')
const playlistsUtils = require('../providers/local/playlist')
const { broadcast } = require('../utils')

jest.mock('../models/playlists')
jest.mock('../models/tracks')
jest.mock('../utils/connection')
jest.mock('../providers/local/playlist')

describe('Playlists service', () => {
  beforeEach(jest.resetAllMocks)

  describe('save', () => {
    it('creates a new playlist', async () => {
      const name = faker.commerce.productName()
      const desc = faker.lorem.paragraph()
      const trackIds = [faker.random.number(), faker.random.number()]
      playlistsModel.save.mockImplementation(async playlist => ({
        saved: [playlist],
        removedIds: []
      }))

      await playlistsService.save({ name, desc, trackIds, trimmedOut: [] })

      const playlist = { id: expect.any(Number), name, desc, trackIds }
      expect(playlistsModel.save).toHaveBeenCalledWith(playlist)
      expect(playlistsModel.save).toHaveBeenCalledTimes(1)
      expect(broadcast).toHaveBeenCalledWith('playlist-changes', [playlist])
      expect(broadcast).not.toHaveBeenCalledWith(
        'playlist-removals',
        expect.anything()
      )
    })

    it('saves an existing playlist', async () => {
      const id = faker.random.number()
      const name = faker.commerce.productName()
      const desc = faker.lorem.paragraph()
      const trackIds = [faker.random.number(), faker.random.number()]
      const playlist = { id, name, desc, trackIds }
      playlistsModel.save.mockResolvedValueOnce({
        saved: [playlist],
        removedIds: []
      })

      await playlistsService.save({ ...playlist, ignored: true })

      expect(playlistsModel.save).toHaveBeenCalledWith(playlist)
      expect(playlistsModel.save).toHaveBeenCalledTimes(1)
      expect(broadcast).toHaveBeenCalledWith('playlist-changes', [playlist])
      expect(broadcast).not.toHaveBeenCalledWith(
        'playlist-removals',
        expect.anything()
      )
    })

    it('removes empty existing playlist', async () => {
      const id = faker.random.number()
      playlistsModel.save.mockResolvedValueOnce({ saved: [], removedIds: [id] })

      await playlistsService.save({ id, trackIds: [] })

      expect(playlistsModel.save).toHaveBeenCalledWith({ id, trackIds: [] })
      expect(playlistsModel.save).toHaveBeenCalledTimes(1)
      expect(broadcast).toHaveBeenCalledWith('playlist-removals', [id])
      expect(broadcast).not.toHaveBeenCalledWith(
        'playlist-changes',
        expect.anything()
      )
    })
  })

  describe('append', () => {
    it('appends tracks to an existing playlist', async () => {
      const id = faker.random.number()
      const name = faker.commerce.productName()
      const desc = faker.lorem.paragraph()
      const trackIds = [faker.random.number(), faker.random.number()]
      const playlist = { id, name, desc, trackIds }
      playlistsModel.getById.mockResolvedValueOnce(playlist)

      const added = [faker.random.number(), faker.random.number()]
      const saved = { ...playlist, trackIds: [...trackIds, ...added] }
      playlistsModel.save.mockResolvedValueOnce({
        saved: [saved],
        removedIds: []
      })

      await playlistsService.append(id, added)

      expect(playlistsModel.getById).toHaveBeenCalledWith(id)
      expect(playlistsModel.getById).toHaveBeenCalledTimes(1)
      expect(playlistsModel.save).toHaveBeenCalledWith(saved)
      expect(playlistsModel.save).toHaveBeenCalledTimes(1)
      expect(broadcast).toHaveBeenCalledWith('playlist-changes', [saved])
      expect(broadcast).not.toHaveBeenCalledWith(
        'playlist-removals',
        expect.anything()
      )
    })

    it('appends single track to an existing playlist', async () => {
      const id = faker.random.number()
      const name = faker.commerce.productName()
      const desc = faker.lorem.paragraph()
      const trackIds = [faker.random.number(), faker.random.number()]
      const playlist = { id, name, desc, trackIds }
      playlistsModel.getById.mockResolvedValueOnce(playlist)

      const added = faker.random.number()
      const saved = { ...playlist, trackIds: [...trackIds, added] }
      playlistsModel.save.mockResolvedValueOnce({
        saved: [saved],
        removedIds: []
      })

      await playlistsService.append(id, added)

      expect(playlistsModel.getById).toHaveBeenCalledWith(id)
      expect(playlistsModel.getById).toHaveBeenCalledTimes(1)
      expect(playlistsModel.save).toHaveBeenCalledWith(saved)
      expect(playlistsModel.save).toHaveBeenCalledTimes(1)
      expect(broadcast).toHaveBeenCalledWith('playlist-changes', [saved])
      expect(broadcast).not.toHaveBeenCalledWith(
        'playlist-removals',
        expect.anything()
      )
    })

    it('ignores unknown playlist', async () => {
      const id = faker.random.number()
      playlistsModel.getById.mockResolvedValueOnce(null)

      await playlistsService.append(id, [
        faker.random.number(),
        faker.random.number()
      ])

      expect(playlistsModel.getById).toHaveBeenCalledWith(id)
      expect(playlistsModel.getById).toHaveBeenCalledTimes(1)
      expect(playlistsModel.save).not.toHaveBeenCalled()
      expect(broadcast).not.toHaveBeenCalled()
    })
  })

  describe('checkIntegrity', () => {
    it('does nothing without marked playlists', async () => {
      await playlistsService.checkIntegrity()
      expect(tracksModel.getByIds).not.toHaveBeenCalled()
      expect(playlistsModel.save).not.toHaveBeenCalled()
      expect(broadcast).not.toHaveBeenCalled()
    })

    it('checks and ignores valid playlists', async () => {
      const playlists = [
        {
          id: faker.random.number(),
          name: faker.commerce.productName(),
          trackIds: [faker.random.number(), faker.random.number()]
        },
        {
          id: faker.random.number(),
          name: faker.commerce.productName(),
          trackIds: [faker.random.number(), faker.random.number()]
        }
      ]
      playlistsModel.save.mockImplementation(async playlist => ({
        saved: [playlist],
        removedIds: []
      }))

      tracksModel.getByIds
        .mockResolvedValueOnce(playlists[0].trackIds.map(id => ({ id })))
        .mockResolvedValueOnce(playlists[1].trackIds.map(id => ({ id })))

      for (const playlist of playlists) {
        await playlistsService.save(playlist, true)
      }
      playlistsModel.save.mockClear()
      broadcast.mockClear()

      await playlistsService.checkIntegrity()
      for (const playlist of playlists) {
        expect(tracksModel.getByIds).toHaveBeenCalledWith(playlist.trackIds)
      }
      expect(tracksModel.getByIds).toHaveBeenCalledTimes(playlists.length)
      expect(playlistsModel.save).not.toHaveBeenCalled()
      expect(broadcast).not.toHaveBeenCalled()
    })

    it('checks and saves invalid playlists', async () => {
      const playlists = [
        {
          id: faker.random.number(),
          name: faker.commerce.productName(),
          trackIds: [faker.random.number(), faker.random.number()]
        },
        {
          id: faker.random.number(),
          name: faker.commerce.productName(),
          trackIds: [faker.random.number(), faker.random.number()]
        },
        {
          id: faker.random.number(),
          name: faker.commerce.productName(),
          trackIds: [faker.random.number(), faker.random.number()]
        }
      ]
      playlistsModel.save.mockImplementation(async playlist =>
        playlist.trackIds.length
          ? { saved: [playlist], removedIds: [] }
          : { saved: [], removedIds: [playlist.id] }
      )

      tracksModel.getByIds
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(playlists[1].trackIds.map(id => ({ id })))
        .mockResolvedValueOnce(
          playlists[2].trackIds.slice(1).map(id => ({ id }))
        )
      const fixedModel = {
        ...playlists[2],
        trackIds: playlists[2].trackIds.slice(1)
      }

      for (const playlist of playlists) {
        await playlistsService.save(playlist, true)
      }
      playlistsModel.save.mockClear()
      broadcast.mockClear()

      await playlistsService.checkIntegrity()
      for (const playlist of playlists) {
        expect(tracksModel.getByIds).toHaveBeenCalledWith(playlist.trackIds)
      }
      expect(tracksModel.getByIds).toHaveBeenCalledTimes(playlists.length)
      expect(playlistsModel.save).toHaveBeenCalledWith({
        ...playlists[0],
        trackIds: []
      })
      expect(playlistsModel.save).toHaveBeenCalledWith(fixedModel)
      expect(playlistsModel.save).toHaveBeenCalledTimes(2)
      expect(broadcast).toHaveBeenCalledWith('playlist-changes', [fixedModel])
      expect(broadcast).toHaveBeenCalledWith('playlist-removals', [
        playlists[0].id
      ])
      expect(broadcast).toHaveBeenCalledTimes(2)
    })

    it('clears the list of playlists marked for checking', async () => {
      const playlist = {
        id: faker.random.number(),
        name: faker.commerce.productName(),
        trackIds: [faker.random.number(), faker.random.number()]
      }
      playlistsModel.save.mockResolvedValueOnce({
        saved: [playlist],
        removedIds: []
      })
      tracksModel.getByIds.mockResolvedValueOnce(
        playlist.trackIds.map(id => ({ id }))
      )

      await playlistsService.save(playlist, true)
      playlistsModel.save.mockClear()
      broadcast.mockClear()

      await playlistsService.checkIntegrity()
      expect(tracksModel.getByIds).toHaveBeenCalledWith(playlist.trackIds)
      expect(tracksModel.getByIds).toHaveBeenCalledTimes(1)
      expect(playlistsModel.save).not.toHaveBeenCalled()
      expect(broadcast).not.toHaveBeenCalled()

      await playlistsService.checkIntegrity()
      expect(tracksModel.getByIds).toHaveBeenCalledTimes(1)
      expect(playlistsModel.save).not.toHaveBeenCalled()
      expect(broadcast).not.toHaveBeenCalled()
    })
  })

  describe('export', () => {
    it('does nothing on unexisting playlist', async () => {
      const selectPath = jest.fn()
      const id = faker.random.number()
      playlistsModel.getById.mockResolvedValueOnce(null)

      await playlistsService.export(id, selectPath)

      expect(playlistsModel.getById).toHaveBeenCalledWith(id)
      expect(playlistsModel.getById).toHaveBeenCalledTimes(1)
      expect(tracksModel.getByIds).not.toHaveBeenCalled()
      expect(selectPath).not.toHaveBeenCalled()
      expect(playlistsUtils.write).not.toHaveBeenCalled()
    })

    it('does not write file without selected file path', async () => {
      const tracks = [
        {
          id: faker.random.number(),
          path: faker.system.filePath()
        }
      ]
      const playlist = {
        id: faker.random.number(),
        name: faker.commerce.productName(),
        trackIds: tracks.map(({ id }) => id)
      }
      playlistsModel.getById.mockResolvedValueOnce(playlist)
      tracksModel.getByIds.mockResolvedValueOnce(tracks)
      const selectPath = jest.fn().mockResolvedValueOnce()

      await playlistsService.export(playlist.id, selectPath)

      expect(playlistsModel.getById).toHaveBeenCalledWith(playlist.id)
      expect(playlistsModel.getById).toHaveBeenCalledTimes(1)
      expect(tracksModel.getByIds).toHaveBeenCalledWith(playlist.trackIds)
      expect(tracksModel.getByIds).toHaveBeenCalledTimes(1)
      expect(selectPath).toHaveBeenCalledWith(playlist, playlistsUtils.formats)
      expect(selectPath).toHaveBeenCalledTimes(1)
      expect(playlistsUtils.write).not.toHaveBeenCalled()
    })

    it('saves playlist to selected path', async () => {
      const tracks = [
        {
          id: faker.random.number(),
          path: faker.system.filePath()
        }
      ]
      const playlist = {
        id: faker.random.number(),
        name: faker.commerce.productName(),
        trackIds: tracks.map(({ id }) => id)
      }
      playlistsModel.getById.mockResolvedValueOnce(playlist)
      tracksModel.getByIds.mockResolvedValueOnce(tracks)
      let filePath = faker.system.filePath()
      filePath = filePath.replace(extname(filePath), '.m3u8')
      const selectPath = jest.fn().mockResolvedValueOnce(filePath)

      await playlistsService.export(playlist.id, selectPath)

      expect(playlistsModel.getById).toHaveBeenCalledWith(playlist.id)
      expect(playlistsModel.getById).toHaveBeenCalledTimes(1)
      expect(tracksModel.getByIds).toHaveBeenCalledWith(playlist.trackIds)
      expect(tracksModel.getByIds).toHaveBeenCalledTimes(1)
      expect(selectPath).toHaveBeenCalledWith(playlist, playlistsUtils.formats)
      expect(selectPath).toHaveBeenCalledTimes(1)
      expect(playlistsUtils.write).toHaveBeenCalledWith(filePath, {
        ...playlist,
        tracks
      })
      expect(playlistsUtils.write).toHaveBeenCalledTimes(1)
    })
  })
})
