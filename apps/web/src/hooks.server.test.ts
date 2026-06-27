import { base } from '$app/paths'
import { describe, expect, it } from 'bun:test'
import { handle } from './hooks.server'

describe('hooks.server.ts', () => {
	it('resolves locale login page and sets cookie', async () => {
		const locale = 'fr'
		const resolveResponse = new Response(null, { status: 200 })
		const resolve = () => Promise.resolve(resolveResponse)
		const response = await handle({
			event: {
				url: new URL(`http://localhost${base}/${locale}`),
				request: new Request(`http://localhost${base}/${locale}`),
				locals: {},
				params: { locale }
			} as never,
			resolve
		})

		expect(response.status).toBe(200)
		expect(response.headers.get('set-cookie')).toContain('token=')
	})

	it('redirects to preferred language when locale is missing', async () => {
		const response = await handle({
			event: {
				url: new URL(`http://localhost${base}/albums`),
				request: new Request(`http://localhost${base}/albums`, {
					headers: { 'accept-language': 'en-US,en;q=0.9' }
				}),
				locals: {},
				params: { locale: undefined }
			} as never,
			resolve: () => Promise.resolve(new Response(null, { status: 200 }))
		})

		expect(response.status).toBe(303)
		expect(response.headers.get('location')).toBe(`${base}/en/albums`)
	})
})
