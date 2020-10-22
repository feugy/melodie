'use strict'

import { translations } from 'svelte-intl'
import en from '../locale/en.yml'
import fr from '../locale/fr.yml'
import './style.svelte'

function defaultDeep(source, defaults) {
  const keys = Object.keys(defaults)
  for (const key of keys) {
    const defaultValue = defaults[key]
    if (!(key in source)) {
      source[key] = defaultValue
    } else if (typeof defaultValue === 'object') {
      source[key] = defaultDeep(source[key], defaultValue)
    }
  }
  return source
}

// use en as default locale, and fallback for missing keys
translations.update({ en, fr: defaultDeep(fr, en) })
