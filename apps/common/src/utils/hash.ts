import { xxHash32 } from 'js-xxhash'

const hashSeed = 0x123abc

/**
 * Uses xxhash algorithm for compute the has of a string value.
 * @param data String to hash
 */
export function hash(data: string) {
	if (!data) {
		return 0
	}
	return xxHash32(data.toLowerCase().trim(), hashSeed)
}
