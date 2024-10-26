import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'
import { take } from './iterables'

describe('take()', () => {
	const values = Array.from({ length: 5 }, () => faker.number.int())

	async function* yieldAndStop(values: number[]) {
		for (const value of values) {
			yield value
		}
	}

	async function* yieldAndThrow(values: number[]) {
		yield* yieldAndStop(values)
		throw new Error('This should not be reached')
	}

	it('takes first returned values', async () => {
		const total = 2
		expect(await take(yieldAndThrow(values), total)).toEqual(
			values.slice(0, total)
		)
	})

	it('takes all available values', async () => {
		expect(await take(yieldAndStop(values), values.length + 5)).toEqual(values)
	})

	it('does not swallow errors', async () => {
		const error = new Error('boom!')
		const generator = (async function* () {
			yield 1
			throw error
		})()
		await expect(take(generator, 5)).rejects.toThrow(error)
	})
})
