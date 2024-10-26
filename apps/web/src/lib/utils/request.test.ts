import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { extractQueryParams, parseRequest } from './request'

interface HttpErrorLike {
	status: number
	body: { message: string }
}

describe('request utilities', () => {
	let url: URL
	beforeEach(() => {
		url = new URL('http://localhost:3000')
	})

	describe('extractQueryParams()', () => {
		it('handles url with no parameters', () => {
			expect(extractQueryParams(url)).toEqual({})
		})

		it('extracts multiple parameters', () => {
			const foo = faker.lorem.word()
			const bar = faker.number.int()
			url.searchParams.append('foo', foo)
			url.searchParams.append('bar', bar.toString())
			expect(extractQueryParams(url)).toEqual({ foo, bar: bar.toString() })
		})

		it('handles parameters with multiple values', () => {
			const foo = [faker.lorem.word(), faker.lorem.word()]
			url.searchParams.append('foo', foo[0])
			url.searchParams.append('foo', foo[1])
			expect(extractQueryParams(url)).toEqual({ foo })
		})
	})

	describe('parseRequest()', () => {
		it('strips out unknown query parameters', async () => {
			const foo = faker.lorem.word()
			url.searchParams.append('foo', foo)
			expect(await parseRequest(new Request(url))).toEqual({
				query: {}
			})
		})

		it('coerce query number parameters', async () => {
			const foo = faker.number.int()
			url.searchParams.append('foo', foo.toString())
			const querySchema = z.object({ foo: z.number() })
			const parsed = await parseRequest(new Request(url), { querySchema })
			expect(parsed).toEqual({ query: { foo } })
		})

		it('handles multiple query parameters', async () => {
			const foo = [faker.lorem.word(), faker.lorem.word()]
			url.searchParams.append('foo', foo[0])
			url.searchParams.append('foo', foo[1])
			const querySchema = z.object({ foo: z.array(z.string()) })
			const parsed = await parseRequest(new Request(url), { querySchema })
			expect(parsed).toEqual({ query: { foo } })
		})

		it('coerces multiple query number parameters', async () => {
			const foo = [faker.number.float(), faker.number.float()]
			url.searchParams.append('foo', foo[0].toString())
			url.searchParams.append('foo', foo[1].toString())
			const querySchema = z.object({ foo: z.array(z.number()) })
			const parsed = await parseRequest(new Request(url), { querySchema })
			expect(parsed).toEqual({ query: { foo } })
		})

		it('rejects invalid query parameters', async () => {
			const foo = faker.lorem.word()
			url.searchParams.append('foo', foo.toString())
			const querySchema = z.object({ foo: z.number() })
			try {
				await parseRequest(new Request(url), { querySchema })
				throw new Error('should have thrown')
			} catch (err) {
				const error = err as HttpErrorLike
				expect(error.status).toEqual(400)
				expect(error.body.message).toEqual(
					'searchParams: Expected number, received nan at "foo"'
				)
			}
		})

		it('allows optional query parameters', async () => {
			const querySchema = z.object({ foo: z.number().optional() })
			const parsed = await parseRequest(new Request(url), { querySchema })
			expect(parsed).toEqual({ query: {} })
		})

		it('rejects missing query parameters', async () => {
			const querySchema = z.object({ foo: z.number(), bar: z.string() })
			try {
				await parseRequest(new Request(url), { querySchema })
				throw new Error('should have thrown')
			} catch (err) {
				const error = err as HttpErrorLike
				expect(error.status).toEqual(400)
				expect(error.body.message).toEqual(
					'searchParams: Required at "foo"; Required at "bar"'
				)
			}
		})

		it('strips out unknown body parameters', async () => {
			const request = new Request(url, {
				method: 'POST',
				body: JSON.stringify({ foo: 'bar' })
			})
			expect(await parseRequest(request, { bodySchema: z.object({}) })).toEqual(
				{
					query: {},
					body: {}
				}
			)
		})

		it('parses JSON body', async () => {
			const bodySchema = z.object({ foo: z.number() })
			const body = { foo: faker.number.int() }
			const request = new Request(url, {
				method: 'POST',
				body: JSON.stringify(body)
			})
			const parsed = await parseRequest(request, { bodySchema })
			expect(parsed).toEqual({ query: {}, body })
		})

		it('rejects missing body', async () => {
			const bodySchema = z.object({ foo: z.number() })
			try {
				await parseRequest(new Request(url, { method: 'POST' }), {
					bodySchema
				})
				throw new Error('should have thrown')
			} catch (err) {
				const error = err as HttpErrorLike
				expect(error.status).toEqual(400)
				expect(error.body.message).toEqual('body: Unexpected end of JSON input')
			}
		})

		it('rejects missing body parameters', async () => {
			const bodySchema = z.object({ foo: z.number() })
			try {
				await parseRequest(new Request(url, { method: 'POST', body: '{}' }), {
					bodySchema
				})
				throw new Error('should have thrown')
			} catch (err) {
				const error = err as HttpErrorLike
				expect(error.status).toEqual(400)
				expect(error.body.message).toEqual('body: Required at "foo"')
			}
		})
	})
})
