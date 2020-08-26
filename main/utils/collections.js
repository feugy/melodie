'use strict'

// https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_uniq
exports.uniq = array => [...new Set(array)]

exports.uniqRef = array => {
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

exports.difference = (array, filtered) => {
  if (!array) {
    return []
  }
  const result = new Array(array.length)
  let j = 0
  for (let i = 0; i < array.length; i++) {
    const item = array[i]
    if (item && (!filtered || !filtered.includes(item))) {
      result[j++] = item
    }
  }
  result.splice(j)
  return result
}

exports.differenceRef = (array, filtered) => {
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

function parseRawRef(string) {
  const [id, name] = string.split(',')
  return [+id, name === 'null' ? null : name.slice(1, -1)]
}

exports.parseRawRef = string =>
  string !== 'null' ? parseRawRef(string.slice(1, -1)) : null

exports.parseRawRefArray = string =>
  string !== 'null'
    ? string.length > 2
      ? string.slice(2, -2).split('],[').map(parseRawRef)
      : []
    : null
