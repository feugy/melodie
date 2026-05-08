import { describe, expect, it } from 'bun:test'
import { handle } from './hooks.server'

describe('hooks.server.ts', () => {
	it('should handle a request and return the expected response', async () => {
		const event = {
			request: new Request('http://localhost/test'),
			locals: {}
		}

		const response = await handle({ event, resolve })

		expect(response).toBeDefined()
		expect(response.status).toBe(200) // Adjust based on your implementation
	})

	it('should handle errors gracefully', async () => {
		const event = {
			request: new Request('http://localhost/error'),
			locals: {}
		}

		try {
			await handle(event)
		} catch (error) {
			expect(error).toBeDefined()
			expect(error.message).toContain('Expected error message') // Adjust based on your implementation
		}
	})
})
