import { get } from 'svelte/store'
import { _ } from 'svelte-intl'

export function translate(/** @type {...any} */ ...args) {
  // @ts-ignore -- WTF?
  return get(_)(...args)
}
