import v from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'

/** Parsed id3 tags. */
export interface Tags {
	title?: string
	album?: string
	albumartist?: string
	/** Main artist. */
	artist?: string
	/** All artists .*/
	artists: string[]
	genre: string[]
	/** Release year. */
	year?: number
	/** Duration in seconds. */
	duration: number
	/** Track position in album. */
	track?: { no?: number; of?: number }
	/** Track position in disk. */
	disk?: { no?: number; of?: number }
	/** Album's cover picture, when set. */
	cover?: { format: string; data: Uint8Array }
	[x: string]: unknown
}

/** A page of list results. */
export interface Page<T> {
	/** Total number of models. */
	total: number
	/** 0-based rank of the first model returned. */
	size: number
	/** Maximum number of models per page. */
	from: number
	/** Sorting criteria used: direction (+ or -) then property (name, rank...). */
	sort: string
	/** Returned models. */
	results: T[]
}

export const dbConfSchema = v.union([
	v.union.if(
		value => v.helpers.isObject(value) && value.kind === 'sqlite3',
		v.object({
			kind: v.literal('sqlite3'),
			filename: v.string()
		})
	),
	v.union.if(
		() => true,
		v.object({
			kind: v.literal('pg'),
			host: v.string(),
			port: v.number().positive().withoutDecimals(),
			user: v.string().optional(),
			password: v.string().optional(),
			database: v.string().optional()
		})
	)
])

/** Represents a configuration object to connect to database.
 */
export type DBConf = Infer<typeof dbConfSchema>

/**
 * Utility type for creating making all fields of a type optional, except the ones listed as required.
 * The hidden child of Partial<> and Pick<>
 * @example: Partial<{ id: string, name: string | null, age: number }, 'id' | 'name'> -> { id: string, name: string | null, age?: number }
 */
export type PartialWithReq<Type, Key extends keyof Type> = Partial<Type> & {
	[P in Key]-?: Type[P]
}
