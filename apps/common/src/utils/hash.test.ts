import { describe, expect, it } from 'bun:test'
import { hash } from './hash.ts'

describe('hash()', () => {
	it.each([
		{ string: 'Full Metal Alchemist', value: 54267642 },
		{ string: 'The Miseducation of Lauryn Hill', value: 79445931 },
		{ string: 'Landmark (Limited Edition Bonus Disc)', value: 3826427026 },
		{ string: 'S.C.I.E.N.C.E.', value: 3333219969 },
		{
			string:
				'Edward Elgar: Symphony No. 1; Pomp and Circumstance Marches Nos. 1 & 4',
			value: 385019323
		}
	])('hashes $string into $value', ({ string, value }) => {
		expect(hash(string)).toBe(value)
	})

	it('is case insensitive', () => {
		expect(hash('SoMeTHing')).toBe(hash('something'))
	})

	it('trims leading and trailing spaces', () => {
		expect(hash('   nothing   ')).toBe(hash('nothing'))
	})
})
