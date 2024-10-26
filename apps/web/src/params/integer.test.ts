import { describe, expect, it } from 'vitest'
import { match } from './integer'

describe('integer/matcher', () => {
	it.each([
		{ value: '-1' },
		{ value: 'abc' },
		{ value: '10.4' },
		{ value: '' }
	])('denies $value', ({ value }) => {
		expect(match(value)).toBe(false)
	})

	it.each([{ value: '1' }, { value: '123456' }])(
		'allows $value',
		({ value }) => {
			expect(match(value)).toBe(true)
		}
	)
})
