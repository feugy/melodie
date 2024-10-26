/** Represents a reference to another model: [id of the referenced model, name of the referenced model]. */
export type Reference = [number, string | null]

/**
 * Returns the copy of an array of references without its duplicates (using reference ids).
 * @param array Source of references to remove duplicates from.
 */
export function uniqRef(array: Reference[]) {
	const ids = new Set<number>()
	const result = new Array<Reference>(array.length)
	let j = 0
	for (let i = 0; i < array.length; i++) {
		const ref = array[i]
		if (!ids.has(ref[0])) {
			result[j++] = ref
			ids.add(ref[0])
		}
	}
	result.splice(j)
	return result
}

/**
 * Returns all references of the source array that are not present in the filtered array (using reference id).
 * @param source Array of references
 * @param filtered Array of references
 */
export function differenceRef<T extends Reference | null | undefined>(
	array?: T[],
	filtered?: T[]
) {
	if (!array) {
		return []
	}
	const ids = new Set(filtered?.map(ref => (ref ? ref[0] : null)))
	const result = new Array<Reference>(array.length)
	let j = 0
	for (let i = 0; i < array.length; i++) {
		const item = array[i]
		if (item && !ids.has(item[0])) {
			result[j++] = item
		}
	}
	result.splice(j)
	return result
}

function _parseRawRef(rawRef: string): Reference {
	// This implementation is faster than
	// - split (which does not handle commas inside name)
	// - for loop
	// - JSON.parse
	const comma = rawRef.indexOf(',')
	const id = rawRef.slice(0, comma)
	const name = rawRef.slice(comma + 1)
	return [
		Number.parseInt(id),
		name === 'null' ? null : name.slice(1, -1).replace(/\\"/g, '"')
	]
}

/**
 * Parse a string representing a model reference into a Reference array.
 * @param rawRef String containing a valid model reference
 */
export function parseRawRef(rawRef: string) {
	return rawRef !== 'null' ? _parseRawRef(rawRef.slice(1, -1)) : null
}

/**
 * Parse a string representing an array of model references into an array of Reference arrays.
 * @param rawRefArray String containing an array of valid model references
 */
export function parseRawRefArray(rawRefArray: string) {
	return rawRefArray !== 'null'
		? rawRefArray.length > 2
			? rawRefArray.slice(2, -2).split('],[').map(_parseRawRef)
			: []
		: null
}
