import { describe, expect, it, mock } from 'bun:test'
import { setTimeout } from 'node:timers/promises'
import { debounce } from './functions'

describe('functions utilities', () => {
	describe('debounce()', () => {
		it('debounces call', async () => {
			const fn = mock()
			const debouncedFn = debounce(fn, 100)

			debouncedFn()
			debouncedFn()
			debouncedFn()
			expect(fn).not.toHaveBeenCalled()

			await setTimeout(500)
			expect(fn).toHaveBeenCalledTimes(1)
		})

		it('propagates args', async () => {
			const fn = mock()
			const debouncedFn = debounce(fn, 100)

			debouncedFn(1, 2)
			debouncedFn(3, 4)
			debouncedFn(5, 6)
			expect(fn).not.toHaveBeenCalled()

			await setTimeout(500)
			expect(fn).toHaveBeenCalledTimes(1)
			expect(fn).toHaveBeenCalledWith(5, 6)
		})
	})
})
