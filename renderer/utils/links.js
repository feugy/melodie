'use strict'

export function linkTo(kind, ref) {
  return ref ? `#/${kind}/${ref[0]}` : ''
}

export function wrapWithLink(kind, ref, className = '') {
  return ref
    ? `<a
    onclick="event.stopPropagation()"
    href="${linkTo(kind, ref)}"
    class="${className} underlined">${ref[1]}</a>`
    : ''
}

export function wrapWithLinks(kind, refs, className = '') {
  return refs.map(ref => wrapWithLink(kind, ref, className))
}
