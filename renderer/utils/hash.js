'use strict'

import { h32 } from 'xxhashjs'

const hashSeed = 0x123abc

export function hash(str) {
  if (!str) {
    return 0
  }
  return h32(str.toLowerCase().trim(), hashSeed).toNumber()
}
