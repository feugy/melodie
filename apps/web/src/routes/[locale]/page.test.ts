import { describe, expect, it } from 'bun:test'
import { base } from '$app/paths'
import { faker } from '@faker-js/faker'
import type { PageLoadEvent } from '../$types'
import { load } from './page'

describe('universal load()', () => {
	it('redirects / on to album list', async () => {
		const locale = faker.helpers.arrayElement(['fr', 'en'])
		const promise = load({
			route: { id: '/' },
			params: { locale }
		} as unknown as PageLoadEvent)

		await expect(promise).rejects.toEqual({
			location: `${base}/${locale}/albums`,
			status: 308
		})
	})

	it('redirects /base on to album list', async () => {
		const locale = faker.helpers.arrayElement(['fr', 'en'])
		const promise = load({
			route: { id: base },
			params: { locale }
		} as unknown as PageLoadEvent)

		await expect(promise).rejects.toEqual({
			location: `${base}/${locale}/albums`,
			status: 308
		})
	})

	it('redirects with default locale', async () => {
		const promise = load({
			route: { id: '/' },
			params: {}
		} as unknown as PageLoadEvent)

		await expect(promise).rejects.toEqual({
			location: `${base}/fr/albums`,
			status: 308
		})
	})

	it('allow other urls', async () => {
		const locale = faker.helpers.arrayElement(['fr', 'en'])
		expect(
			await load({
				route: { id: '/whatever' },
				params: { locale }
			} as unknown as PageLoadEvent)
		).toBeUndefined()
	})
})
