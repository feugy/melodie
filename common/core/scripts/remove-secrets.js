require('dotenv').config()
import fs from 'fs-extra'
import minimatch from 'minimatch'
import { from, of } from 'rxjs'
import { filter, map, mergeMap } from 'rxjs/operators'
const {
  utils: { walk }
} = require('..')

/**
 * Simple script that takes file path as argument, read them and replace any secrets with placeholders
 * It is intended to be run with lint-staged:
 *
 * "lint-staged": {
 *   "** /__nocks__/*.json": [
 *     "node scripts/remove-secrets"
 *   ]
 * }
 *
 * But also from CLI:
 * node scripts/remove-secrets --glob ** /__nocks__/*.json
 */
const args = process.argv.slice(2)
const hasGlob = args[0] === '--glob'

;(hasGlob ? walk('.') : of(...args))
  .pipe(
    map(data => (hasGlob ? data.path : data)),
    filter(hasGlob ? minimatch.filter(args[1]) : () => true),
    mergeMap(path =>
      from(fs.readFile(path, 'utf8')).pipe(
        mergeMap(content =>
          fs.writeFile(
            path,
            content.replace(process.env.DISCOGS_TOKEN, 'TOKEN')
          )
        )
      )
    )
  )
  .subscribe()
