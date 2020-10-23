'use strict'

import { translations } from 'svelte-intl'

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

export const defaultKey = 'default'

/**
 * Configure several translations.
 * Each translation bundle is an object which keys are translation keys, and values translated strings.
 * You can configure several bundles at once.
 * One bundle can be set as default: its keys will be merged into other bundles.
 * Translation bundles are associated to a language code.
 * @param {Map<string, object>} added - a map of translations, keys being language code, values being translation bundle
 * @see https://github.com/Panya/svelte-intl#translations
 */
export function addTranslations(added) {
  const defaultTranslation = added.get(defaultKey) || {}
  for (const [language, translation] of added) {
    if (language !== defaultKey) {
      translations.update({
        [language]: defaultDeep(translation, defaultTranslation)
      })
    }
  }
}
