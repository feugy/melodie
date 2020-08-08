'use strict'

require('dotenv').config()
const fs = require('fs-extra')
const { of, from } = require('rxjs')
const { mergeMap } = require('rxjs/operators')

/**
 * Simple script that takes file path as argument, read them and replace any keys with placeholders
 * It is intended to be run with lint-staged:
 *
 * "lint-staged": {
 *   "** /__nocks__/*.json": [
 *     "node scripts/remove-keys"
 *   ]
 * }
 */
of(...process.argv.slice(2))
  .pipe(
    mergeMap(path =>
      from(fs.readFile(path, 'utf8')).pipe(
        mergeMap(content =>
          fs.writeFile(
            path,
            content
              .replace(process.env.DISCOGS_KEY, 'KEY')
              .replace(process.env.DISCOGS_SECRET, 'SECRET')
          )
        )
      )
    )
  )
  .subscribe()
