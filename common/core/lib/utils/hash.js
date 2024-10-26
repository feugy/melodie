import { h32 } from 'xxhashjs'

const hashSeed = 0x123abc

/**
 * Uses xxhash algorithm for compute the has of a string value.
 * @param {string} data - the data to hash
 * @returns {number} the hash value
 */
export const hash = function (data) {
  if (!data) {
    return 0
  }
  return h32(data.toLowerCase().trim(), hashSeed).toNumber()
}
