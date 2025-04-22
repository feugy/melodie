import { describe, expect, it } from 'bun:test'
import { setTimeout } from 'node:timers/promises'
import { raceConcurrently } from './promises.ts'

describe('raceConcurrently()', () => {
	it('returns each promise results', async () => {
		const tasks = Array.from({ length: 4 }, (_, i) => () => Promise.resolve(i))
		expect(await raceConcurrently(tasks, 2)).toEqual([
			{ status: 'fulfilled', value: 0 },
			{ status: 'fulfilled', value: 1 },
			{ status: 'fulfilled', value: 2 },
			{ status: 'fulfilled', value: 3 }
		])
	})

	it('does not fail on first error', async () => {
		const tasks = Array.from(
			{ length: 4 },
			(_, i) => () =>
				i >= 1 && i <= 2
					? Promise.reject(new Error(`boom ${i}`))
					: Promise.resolve(i)
		)
		expect(await raceConcurrently(tasks, 2)).toEqual([
			{ status: 'fulfilled', value: 0 },
			{ status: 'rejected', reason: new Error('boom 1') },
			{ status: 'rejected', reason: new Error('boom 2') },
			{ status: 'fulfilled', value: 3 }
		])
	})

	it('runs tasks in order', async () => {
		const logs: string[] = []
		const tasks = Array.from({ length: 6 }, (_, i) => async () => {
			logs.push(`start ${i + 1}`)
			await setTimeout(i + 1 * 10)
			logs.push(`end ${i + 1}`)
		})
		await raceConcurrently(tasks, 3)
		expect(logs).toEqual([
			'start 1', // t0
			'start 2', // t0
			'start 3', // t0
			'end 1', // t10
			'start 4', // t10
			'end 2', // t20
			'start 5', // t20
			'end 3', // t30
			'start 6', // t30
			'end 4', // t40
			'end 5', // t50
			'end 6' // t60
		])
	})
})
