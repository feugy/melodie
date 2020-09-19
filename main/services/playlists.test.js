'use strict'

const faker = require('faker')
const { playlistsModel } = require('../models/playlists')
const playlistsService = require('./playlists')
const { broadcast } = require('../utils')

jest.mock('../models/playlists')
jest.mock('../utils/electron-remote')

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
      expect(broadcast).toHaveBeenCalledWith('playlist-change', playlist)
      expect(broadcast).not.toHaveBeenCalledWith(
        'playlist-removal',
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
      expect(broadcast).toHaveBeenCalledWith('playlist-change', playlist)
      expect(broadcast).not.toHaveBeenCalledWith(
        'playlist-removal',
        expect.anything()
      )
    })

    it('removes empty existing playlist', async () => {
      const id = faker.random.number()
      playlistsModel.save.mockResolvedValueOnce({ saved: [], removedIds: [id] })

      await playlistsService.save({ id, trackIds: [] })

      expect(playlistsModel.save).toHaveBeenCalledWith({ id, trackIds: [] })
      expect(playlistsModel.save).toHaveBeenCalledTimes(1)
      expect(broadcast).toHaveBeenCalledWith('playlist-removal', id)
      expect(broadcast).not.toHaveBeenCalledWith(
        'playlist-change',
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
      expect(broadcast).toHaveBeenCalledWith('playlist-change', saved)
      expect(broadcast).not.toHaveBeenCalledWith(
        'playlist-removal',
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
      expect(broadcast).toHaveBeenCalledWith('playlist-change', saved)
      expect(broadcast).not.toHaveBeenCalledWith(
        'playlist-removal',
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
})
