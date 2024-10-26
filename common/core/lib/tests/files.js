import { faker } from '@faker-js/faker'
import fs from 'fs-extra'
import os from 'os'
import { dirname, join } from 'path'

export async function makeFolder({
  folder = join(os.tmpdir(), 'melodie-'),
  fileNb = faker.number.int({ min: 2, max: 10 }),
  depth = 1
} = {}) {
  const files = []
  folder = await fs.mkdtemp(folder)
  const directFilesNb =
    depth === 1 ? fileNb : faker.number.int({ min: 1, max: fileNb - depth })
  for (const n of Array.from({ length: directFilesNb }, (v, i) => i)) {
    const path = join(
      folder,
      `${depth}-${n}.${faker.helpers.arrayElement(['mp3', 'ogg', 'flac'])}`
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

export async function makePlaylists({
  files,
  playlistNb = faker.number.int({ min: 2, max: 5 })
}) {
  const playlists = []
  for (let n = 0; n < playlistNb; n++) {
    const folder = dirname(faker.helpers.arrayElement(files).path)
    const path = join(
      folder,
      `${n}.${faker.helpers.arrayElement(['m3u', 'm3u8'])}`
    )
    await fs.createFile(path)
    playlists.push(path)
  }
  return { playlists }
}
