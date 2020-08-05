'use strict'

import { hash } from './hash'

export function linkTo(kind, name) {
  return `#/${kind}/${hash(name)}`
}

export function wrapWithLink(kind, name, className = '') {
  return name
    ? `<a
    onclick="event.stopPropagation()"
    href="${linkTo(kind, name)}"
    class="${className} underlined">${name}</a>`
    : ''
}

export function wrapWithLinks(kind, names, className = '') {
  return names.map(name => wrapWithLink(kind, name, className))
}
