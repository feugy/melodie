'use strict'

const os = require('os')
const { dirname, join } = require('path')
const fs = require('fs-extra')
const faker = require('faker')

async function makeFolder({
  folder = join(os.tmpdir(), 'melodie-'),
  fileNb = faker.datatype.number({ min: 2, max: 10 }),
  depth = 1
} = {}) {
  const files = []
  folder = await fs.mkdtemp(folder)
  const directFilesNb =
    depth === 1
      ? fileNb
      : faker.datatype.number({ min: 1, max: fileNb - depth })
  for (const n of Array.from({ length: directFilesNb }, (v, i) => i)) {
    const path = join(
      folder,
      `${depth}-${n}.${faker.random.arrayElement(['mp3', 'ogg', 'flac'])}`
    )
    await fs.createFile(path)
    files.push({ path, stats: await fs.stat(path) })
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

exports.makeFolder = makeFolder

async function makePlaylists({
  files,
  playlistNb = faker.datatype.number({ min: 2, max: 5 })
}) {
  const playlists = []
  for (let n = 0; n < playlistNb; n++) {
    const folder = dirname(faker.random.arrayElement(files).path)
    const path = join(
      folder,
      `${n}.${faker.random.arrayElement(['m3u', 'm3u8'])}`
    )
    await fs.createFile(path)
    playlists.push(path)
  }
  return { playlists }
}

exports.makePlaylists = makePlaylists
