import { models } from '@melodie/core'
import { shell } from 'electron'

export * from '@melodie/core/lib/services/tracks.js'

/**
 * Opens the folder containing a given track
 * @param {String} track id - the opened track id
 */
export async function openContainingFolder(trackId) {
  // eslint-disable-next-line testing-library/no-await-sync-queries -- this is not a DOM query.
  const model = await models.tracksModel.getById(trackId)
  if (model) {
    shell.showItemInFolder(encodeURIComponent(model.path).replace(/%2F/g, '/'))
  }
}
