'use strict'

const faker = require('faker')
const { join } = require('path')
const fs = require('fs-extra')
const os = require('os')
const engine = require('./file-loader')
const tag = require('./tag-reader')
const covers = require('./cover-finder')
const lists = require('./list-engine')
const electron = require('electron')
const mockOs = require('os')
const { hash } = require('../utils')

jest.mock('electron', () => ({
  dialog: {
    showOpenDialog: jest.fn()
  },
  app: {
    getAppPath: jest.fn()
  }
}))
jest.mock('./list-engine')
jest.mock('./cover-finder')
jest.mock('./tag-reader')

async function makeFolder({
  folder = join(os.tmpdir(), 'melodie-'),
  fileNb = faker.random.number({ min: 2, max: 10 }),
  depth = 1
} = {}) {
  const files = []
  folder = await fs.mkdtemp(folder)
  const directFilesNb =
    depth === 1 ? fileNb : faker.random.number({ min: 1, max: fileNb - depth })
  for (const n of Array.from({ length: directFilesNb }, (v, i) => i)) {
    const file = join(
      folder,
      `${depth}-${n}.${faker.random.arrayElement(['mp3', 'ogg', 'flac'])}`
    )
    files.push(file)
    await fs.createFile(file)
  }
  if (depth > 1) {
    files.push(
      ...(
        await makeFolder({
          folder: join(folder, 'folder-'),
          fileNb: fileNb - directFilesNb,
          depth: depth - 1
        })
      ).files
    )
  }
  return { files, folder }
}

describe('File loader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    electron.app.getAppPath.mockReturnValue(mockOs.tmpdir())
  })

  describe('chooseFolder', () => {
    it('loads files selected from dialog', async () => {
      const filePaths = [faker.system.fileName(), faker.system.fileName()]
      electron.dialog.showOpenDialog.mockResolvedValueOnce({ filePaths })
      expect(await engine.chooseFolders()).toEqual(filePaths)
    })
  })

  describe('crawl', () => {
    it('handles no selection', async () => {
      expect(await engine.crawl())
      expect(lists.add).not.toHaveBeenCalled()
      expect(covers.findFor).not.toHaveBeenCalled()
      expect(tag.read).not.toHaveBeenCalled()
    })

    it('handles empty selection', async () => {
      expect(await engine.crawl([]))
      expect(lists.add).not.toHaveBeenCalled()
      expect(covers.findFor).not.toHaveBeenCalled()
      expect(tag.read).not.toHaveBeenCalled()
    })

    it('enrich tracks with tags and cover', async () => {
      const { folder, files } = await makeFolder({ depth: 3, fileNb: 10 })
      covers.findFor.mockResolvedValue(null)
      tag.read.mockResolvedValue({})

      const tracks = await engine.crawl([folder])
      expect(tracks).toEqual(
        expect.arrayContaining(
          files.map(path => ({
            id: hash(path),
            path: path,
            media: null,
            tags: {}
          }))
        )
      )
      expect(tracks).toHaveLength(files.length)
      expect(lists.add).toHaveBeenCalledWith(tracks)
      expect(lists.add).toHaveBeenCalledTimes(1)
      for (const path of files) {
        expect(covers.findFor).toHaveBeenCalledWith(path)
        expect(tag.read).toHaveBeenCalledWith(path)
      }
      expect(covers.findFor).toHaveBeenCalledTimes(files.length)
      expect(tag.read).toHaveBeenCalledTimes(files.length)
    })

    it('process tracks in batches', async () => {
      const { folder, files } = await makeFolder({ depth: 3, fileNb: 270 })
      lists.add.mockImplementation(
        () =>
          new Promise(r =>
            setTimeout(r, faker.random.number({ min: 100, max: 200 }))
          )
      )
      covers.findFor.mockResolvedValue(null)
      tag.read.mockResolvedValue({})

      const tracks = await engine.crawl([folder])
      expect(tracks).toHaveLength(files.length)
      expect(lists.add).toHaveBeenCalledTimes(6)
      expect(covers.findFor).toHaveBeenCalledTimes(files.length)
      expect(tag.read).toHaveBeenCalledTimes(files.length)
    })
  })
})
