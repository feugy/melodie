import { error } from '@sveltejs/kit'
import { type ZodRawShape, z } from 'zod'
import type { ZodAny } from 'zod'
import { fromZodError, isZodErrorLike } from 'zod-validation-error'

export function extractQueryParams(url: URL) {
	const result: Record<string, string | string[]> = {}
	for (const [key, value] of url.searchParams.entries()) {
		if (key in result) {
			if (!Array.isArray(result[key])) {
				result[key] = [result[key]]
			}
			result[key].push(value)
		} else {
			result[key] = value
		}
	}
	return result
}

function augmentQuerySchema<Q extends z.AnyZodObject>({ shape }: Q) {
	const augmented: ZodRawShape = {}
	for (const [key, schema] of Object.entries<ZodAny>(shape)) {
		if (schema instanceof z.ZodArray) {
			augmented[key] = z.preprocess(
				val =>
					(Array.isArray(val) ? val : [val]).map(val =>
						coerce((schema._def as { type: z.ZodAny }).type).parse(val)
					),
				schema
			)
		} else {
			augmented[key] = coerce(schema)
		}
	}
	return z.object(augmented) as Q
}

function coerce(schema: z.ZodAny) {
	return schema instanceof z.ZodNumber
		? z.preprocess(val => (val !== undefined ? Number(val) : val), schema)
		: schema
}

async function parseOrThrow(
	getInput: () => Promise<Record<string, unknown>>,
	schema: z.ZodTypeAny,
	prefix: string
) {
	try {
		return schema.parse(await getInput())
	} catch (err) {
		if (isZodErrorLike(err)) {
			error(400, fromZodError(err, { prefix }))
		}
		if (err instanceof SyntaxError) {
			error(400, `${prefix}: ${err.message}`)
		}
		throw err
	}
}

export async function parseRequest<
	Q extends z.AnyZodObject,
	B extends z.ZodTypeAny | undefined
>(
	request: Request,
	{ querySchema, bodySchema }: { querySchema?: Q; bodySchema?: B } = {}
) {
	const query = (await parseOrThrow(
		async () => extractQueryParams(new URL(request.url)),
		augmentQuerySchema(querySchema ?? z.object({})),
		'searchParams'
	)) as z.infer<Q>

	const body = bodySchema
		? await parseOrThrow(request.json.bind(request), bodySchema, 'body')
		: undefined
	return {
		query,
		body: body as B extends z.ZodTypeAny ? z.infer<B> : undefined
	}
}
