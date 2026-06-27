import { describe, expect, it } from 'bun:test'
import { base } from '$app/paths'
import { faker } from '@faker-js/faker'
import type { PageServerLoadEvent } from './$types'
import { load } from './+page.server'

describe('server load()', () => {
	it('redirects to album list when already logged in', async () => {
		const locale = faker.helpers.arrayElement(['fr', 'en'])
		try {
			await load({
				locals: { session: { token: 'test-token', userId: 1 } },
				params: { locale }
			} as PageServerLoadEvent)
			expect.unreachable('load() should throw redirect')
		} catch (error) {
			expect(error).toMatchObject({
				location: `${base}/${locale}/albums`,
				status: 303
			})
		}
	})

	it('does nothing when no session exists', async () => {
		const locale = faker.helpers.arrayElement(['fr', 'en'])

		expect(
			await load({
				locals: {},
				params: { locale }
			} as PageServerLoadEvent)
		).toBeUndefined()
	})

	it('does nothing when session is null', async () => {
		const locale = faker.helpers.arrayElement(['fr', 'en'])

		expect(
			await load({
				locals: { session: null },
				params: { locale }
			} as PageServerLoadEvent)
		).toBeUndefined()
	})
})
