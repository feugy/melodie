import {
	afterAll,
	beforeAll,
	describe,
	expect,
	it,
	mock
} from 'bun:test'
// Direct import avoids the $lib/client barrel eagerly loading
// screen.svelte.ts before screen.svelte.test.ts registers its DOM.
import { localLibrary } from '../../client/local-library.svelte.ts'
import { makeTrack } from '$lib/tests/factories'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { render } from '@testing-library/svelte'
import { tick } from 'svelte'

mock.module('$app/navigation', () => ({
	goto: async () => void 0,
	invalidate: async () => void 0
}))
mock.module('$app/environment', () => ({ browser: true }))

async function flushEffects() {
	await Promise.resolve()
	await tick()
}

describe('LocalPin component', () => {
	let LocalPin: typeof import('./local-pin.svelte').default

	beforeAll(async () => {
		GlobalRegistrator.register()
		LocalPin = (await import('./local-pin.svelte')).default
	})

	afterAll(() => {
		GlobalRegistrator.unregister()
	})

	it('stays hidden while the library is disconnected', async () => {
		const track = makeTrack({ id: 1, agentId: 1, path: 'a/album/01.flac' })
		const { container } = render(LocalPin, { track })
		await flushEffects()

		expect(container.querySelector('svg')).toBeNull()
	})

	it('appears reactively once a connected library confirms the track', async () => {
		const track = makeTrack({ id: 2, agentId: 1, path: 'a/album/02.flac' })
		const library = localLibrary as unknown as {
			fileMap: Map<string, File> | null
			state: string
		}
		library.fileMap = new Map([[track.path, new File([], '02.flac')]])
		library.state = 'disconnected'

		const { container } = render(LocalPin, { track })
		await flushEffects()
		expect(container.querySelector('svg')).toBeNull()

		// Simulate connect(): state flips, effect must re-run check().
		library.state = 'connected'
		await flushEffects()

		expect(container.querySelector('svg')).not.toBeNull()

		library.fileMap = null
		library.state = 'disconnected'
	})
})
