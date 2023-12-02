import { app } from 'electron'
import { join } from 'path'

/**
 * Computes full path to a file the application can write into, inside user data folders.
 * @param {string} file - name of the desired file.
 * @returns {string} full path to that file
 */
export function getStoragePath(file) {
  return join(app.getPath('userData'), `${file}`)
}
