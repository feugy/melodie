import { get } from 'svelte/store'
import { translate } from 'svelte-intl'

export function linkTo(kind, ref) {
  return ref ? `#/${kind}/${ref[0]}` : ''
}

export function wrapWithLink(kind, ref, className = '') {
  return ref
    ? `<a
    onclick="event.stopPropagation()"
    href="${linkTo(kind, ref)}"
    class="${className ? className + ' ' : ''}underlined">${
      ref[1] || get(translate)('unknown')
    }</a>`
    : ''
}

export function wrapWithLinks(kind, refs, className = '') {
  return refs.map(ref => wrapWithLink(kind, ref, className))
}
