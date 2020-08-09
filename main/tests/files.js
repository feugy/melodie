'use strict'

const os = require('os')
const { join } = require('path')
const fs = require('fs-extra')
const faker = require('faker')

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
