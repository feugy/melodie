import { t } from 'svelte-intl-precompile'
import { get } from 'svelte/store'

interface MessageObject {
	locale?: string
	format?: string
	default?: string
	values?: Record<string, string | number | Date>
}
interface MessageObjectWithId extends MessageObject {
	id: string
}

export function translate(
	id: string | MessageObjectWithId,
	options?: MessageObject
) {
	return get(t)(id, options)
}
