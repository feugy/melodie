import { base } from '$app/paths'
import type { Kind } from '$lib/types'
import type { Reference } from '@melodie/common/utils'
import { locale, t } from 'svelte-intl-precompile'
import { get } from 'svelte/store'

export function linkTo(to: Kind, ref?: Reference | null) {
	return ref ? `${base}/${get(locale)}/${to}/${ref[0]}` : ''
}

export function wrapWithLink(to: Kind, ref?: Reference | null, className = '') {
	return ref
		? `<a
    href="${linkTo(to, ref)}"
    class="${className ? `${className} ` : ''}underlined">${
			ref[1] || get(t)('unknown')
		}</a>`
		: ''
}

export function wrapWithLinks(
	to: Kind,
	refs: (Reference | null | undefined)[],
	className = ''
) {
	return refs.map(ref => wrapWithLink(to, ref, className))
}
