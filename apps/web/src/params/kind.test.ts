import { describe, expect, it } from 'bun:test'
import { match } from './kind'

describe('kind/matcher', () => {
	it.each([
		{ value: 'artist' },
		{ value: 'abc' },
		{ value: '10.4' },
		{ value: '' }
	])('denies $value', ({ value }) => {
		expect(match(value)).toBe(false)
	})

	it.each([{ value: 'artists' }, { value: 'albums' }])(
		'allows $value',
		({ value }) => {
			expect(match(value)).toBe(true)
		}
	)
})
