import type { Reference } from '@melodie/common/utils'
import { t } from 'svelte-intl-precompile'
import { get } from 'svelte/store'

type LinkTo = 'album' | 'artist'

export function linkTo(to: LinkTo, ref?: Reference | null) {
	return ref ? `/${to}s/${ref[0]}` : ''
}

export function wrapWithLink(
	to: LinkTo,
	ref?: Reference | null,
	className = ''
) {
	return ref
		? `<a
    onclick="event.stopPropagation()"
    href="${linkTo(to, ref)}"
    class="${className ? `${className} ` : ''}underlined">${
			ref[1] || get(t)('unknown')
		}</a>`
		: ''
}

export function wrapWithLinks(
	to: LinkTo,
	refs: (Reference | null | undefined)[],
	className = ''
) {
	return refs.map(ref => wrapWithLink(to, ref, className))
}
