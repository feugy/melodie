/**
 * Returns the copy of an array without its duplicates (using strict equality).
 * @param {array} array - source to remove duplicates from
 * @returns {array} copy of source containing only unique values
 * @see https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_uniq
 */
export const uniq = array => [...new Set(array)]

/**
 * Represents a reference to another model:
 * @typedef {array} Reference
 * @property {number} 0 - id of the referenced model
 * @property {string} 1 - name of the referenced model
 */

/**
 * Returns the copy of an array of references without its duplicates (using reference ids).
 * @param {array<Reference>} array - source of references to remove duplicates from
 * @returns {array<Reference>} copy of source containing only unique references
 */
export const uniqRef = array => {
  const ids = new Set()
  const result = new Array(array.length)
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
 * Returns all element of the source array that are not present in the filtered array (using strict equality).
 * @param {array} source    - array of items
 * @param {array} filtered  - array of items
 * @returns {array} items of source not present in filtered (if any)
 */
export const difference = (source, filtered) => {
  if (!source) {
    return []
  }
  const result = new Array(source.length)
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

/**
 * Returns all references of the source array that are not present in the filtered array (using reference id).
 * @param {array<Reference>} source    - array of references
 * @param {array<Reference>} filtered  - array of references
 * @returns {array<Reference>} references of source not present in filtered (if any)
 */
export const differenceRef = (array, filtered) => {
  if (!array) {
    return []
  }
  const ids = new Set(filtered && filtered.map(ref => (ref ? ref[0] : null)))
  const result = new Array(array.length)
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

function parseRawRefInner(rawRef) {
  // This implementation is faster than
  // - split (which does not handle commas inside name)
  // - for loop
  // - JSON.parse
  const comma = rawRef.indexOf(',')
  const id = rawRef.slice(0, comma)
  const name = rawRef.slice(comma + 1)
  return [+id, name === 'null' ? null : name.slice(1, -1).replace(/\\"/g, '"')]
}

/**
 * Parse a string representing a model reference into a Reference array.
 * @param {string} rawRef - string containing a valid model reference
 * @returns {Reference} parsed reference, or null
 */
export const parseRawRef = rawRef =>
  rawRef !== 'null' ? parseRawRefInner(rawRef.slice(1, -1)) : null

/**
 * Parse a string representing an array of model references into an array of Reference arrays.
 * @param {string} rawRefArray - string containing an array of valid model references
 * @returns {array<Reference>} parsed array of references, or null
 */
export const parseRawRefArray = rawRefArray =>
  rawRefArray !== 'null'
    ? rawRefArray.length > 2
      ? rawRefArray.slice(2, -2).split('],[').map(parseRawRefInner)
      : []
    : null
