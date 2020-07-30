'use strict'

const fs = require('fs-extra')
const os = require('os')
const { join } = require('path')
const engine = require('./cover-finder')

jest.mock('electron', () => ({
  dialog: {
    showOpenDialog: jest.fn()
  },
  app: {
    getPath: jest.fn()
  }
}))

describe('Cover finder', () => {
  let path

  beforeEach(async () => {
    path = await fs.mkdtemp(join(os.tmpdir(), 'melodie-'))
  })

  it('returns null for cover-less path', async () => {
    expect(await engine.findFor(join(path, 'file.mp3'))).toBe(null)
  })

  it('finds gif', async () => {
    const gif = join(path, 'folder.gif')
    await fs.ensureFile(gif)
    expect(await engine.findFor(join(path, 'file.mp3'))).toEqual(gif)
  })

  it('finds png', async () => {
    const png = join(path, 'folder.png')
    await fs.ensureFile(png)
    expect(await engine.findFor(join(path, 'file.mp3'))).toEqual(png)
  })

  it('finds jpeg', async () => {
    const jpeg = join(path, 'cover.jpeg')
    await fs.ensureFile(jpeg)
    expect(await engine.findFor(join(path, 'file.mp3'))).toEqual(jpeg)
  })

  it('finds capitalized', async () => {
    const jpeg = join(path, 'Cover.jpeg')
    await fs.ensureFile(jpeg)
    expect(await engine.findFor(join(path, 'file.mp3'))).toEqual(jpeg)
  })

  describe('given cover.jpg', () => {
    let jpg
    beforeEach(async () => {
      jpg = join(path, 'cover.jpg')
      await fs.ensureFile(jpg)
    })

    it('finds it for a track', async () => {
      expect(await engine.findFor(join(path, 'file.mp3'))).toEqual(jpg)
    })

    it('finds it for an album', async () => {
      expect(await engine.findFor(path)).toEqual(jpg)
    })
  })
})
