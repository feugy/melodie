import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import type { Screen } from './screen.svelte'

describe('screen', () => {
	let screen: Screen

	beforeAll(async () => {
		GlobalRegistrator.register()
		;({ screen } = await import('./screen.svelte'))
	})

	afterAll(() => GlobalRegistrator.unregister())

	it.each([
		{ width: 3000, size: 4 },
		{ width: 1600, size: 4 },
		{ width: 1280, size: 4 },
		{ width: 1100, size: 3 },
		{ width: 1024, size: 3 },
		{ width: 800, size: 2 },
		{ width: 768, size: 2 },
		{ width: 300, size: 1 },
		{ width: 1, size: 1 }
	])('detects %o screen size', async ({ width, size }) => {
		window.happyDOM.setViewport({ width, height: 768 })
		expect(screen.size).toBe(size)
	})

	it('detects hovering capabilities', async () => {
		expect(screen.supportHover).toBe(true)
	})
})
