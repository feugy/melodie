import { describe, expect, it } from 'bun:test'
import { encode, compare } from './password.ts'

describe('encode() + compare()', () => {
	it.each(['yoloOneMoreBro!', 'super-secure-pa$$word', '1234'])(
		'encodes and compares %s',
		async password => {
			const encoded = await encode(password)
			expect(encoded).toBeDefined()
			expect(encoded).not.toInclude(password)
			expect(await compare(password, encoded)).toBe(true)
			expect(await compare(password, `${encoded}2`)).toBe(false)
		}
	)
})
