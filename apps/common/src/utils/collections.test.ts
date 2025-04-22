import { describe, expect, it } from 'bun:test'
import { difference, uniq } from './collections.ts'

describe('difference()', () => {
	it('removes unwanted elements', () => {
		expect(difference([1, 2, 3, 4, 5], [5, 10, 2])).toEqual([1, 3, 4])
	})

	it('supports undefined target', () => {
		expect(difference(undefined, [5, 10, 2])).toEqual([])
	})

	it('supports undefined source', () => {
		expect(difference([1, 2, 3, 4, 5], undefined)).toEqual([1, 2, 3, 4, 5])
	})

	it('removes undefined', () => {
		expect(difference([1, null, 3, undefined, 5], [5, null, 2])).toEqual([1, 3])
	})
})

describe('uniq()', () => {
	it('removes duplicates', () => {
		expect(uniq([1, 2, 2, 3, 4, 5, 4, 1])).toEqual([1, 2, 3, 4, 5])
	})
})
