import fs from 'fs-extra'

import { tracksModel } from '../index.js'

export async function up(db) {
  await db.schema.table('tracks', table => {
    table.bigInteger('ino')
  })
  // migrate existing data: read all tracks and populate their inodes
  let from = 0
  const size = 100
  tracksModel.db = db
  let page = await tracksModel.list({ from, size })
  while (page.results.length) {
    for (const track of page.results) {
      track.ino = (await fs.stat(track.path)).ino
    }
    await tracksModel.save(page.results)
    from += page.results.length
    page = await tracksModel.list({ from, size })
  }
}

export async function down({ schema }) {
  await schema.table('tracks', table => {
    table.dropColumn('ino')
  })
}
