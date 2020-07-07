'use strict'

export function toDOMSrc(path) {
  return path && path.replace(/#/g, '%23')
}
