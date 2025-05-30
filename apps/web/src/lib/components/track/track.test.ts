import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { base } from '$app/paths'
import { makeAgentById } from '$lib/tests/factories'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { render } from '@testing-library/svelte'
import { locale } from 'svelte-intl-precompile'
import { get } from 'svelte/store'
import Track from './track.svelte'
import { trackData } from './track.testdata'

describe('Track component', () => {
	const agentById = makeAgentById()

	beforeAll(() => {
		GlobalRegistrator.register()
	})

	afterAll(() => GlobalRegistrator.unregister())

	it('has link to artist', async () => {
		const [id, artist] = trackData.artistRefs?.[0] ?? ['', '']
		const screen = render(Track, { agentById, src: trackData })
		const anchor = screen.getByText(artist ?? '')
		expect(anchor).toHaveAttribute(
			'href',
			`${base}/${get(locale)}/artists/${id}`
		)
	})

	it('has link to album', async () => {
		const [id] = trackData.albumRef ?? ['']
		const screen = render(Track, { agentById, src: trackData })
		const anchor = screen.getByRole('img').parentElement
		expect(anchor).toHaveAttribute(
			'href',
			`${base}/${get(locale)}/albums/${id}`
		)
	})

	it('can have no links', async () => {
		const screen = render(Track, {
			agentById,
			src: trackData,
			withLinks: false
		})
		expect(screen.queryAllByRole('anchor')).toHaveLength(0)
	})
})
