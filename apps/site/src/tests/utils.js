'use strict'

import { get } from 'svelte/store'
import { _ } from 'svelte-intl'

export function sleep(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function translate(...args) {
  return get(_)(...args)
}
