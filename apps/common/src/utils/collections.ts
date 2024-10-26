/**
 * Returns the copy of an array without its duplicates (using strict equality).
 * @param array Source to remove duplicates from.
 * @see https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_uniq
 */
export function uniq<T>(array: T[]) {
	return [...new Set(array)]
}

/**
 * Returns all element of the source array that are not present in the filtered array (using strict equality).
 * @param source Array of items
 * @param filtered Array of items
 */
export function difference<T>(source?: T[], filtered?: T[]) {
	if (!source) {
		return []
	}
	const result = new Array<T>(source.length)
	let j = 0
	for (let i = 0; i < source.length; i++) {
		const item = source[i]
		if (item && (!filtered || !filtered.includes(item))) {
			result[j++] = item
		}
	}
	result.splice(j)
	return result
}
