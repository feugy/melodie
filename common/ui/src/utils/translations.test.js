import { get } from 'svelte/store'
import { locale, translate, translations } from 'svelte-intl'
import { beforeEach, describe, expect, it } from 'vitest'

import { addTranslations, defaultKey } from './translations'

describe('translations utilities', () => {
  beforeEach(() => {
    translations.set({})
  })

  it('configure a simple bundle', () => {
    const added = new Map()
    added.set('en', { key1: 'hello', key2: 'world' })
    addTranslations(added, translations)
    expect(get(translate)('key1')).toBe('hello')
  })

  it('configure a several bundles', () => {
    const added = new Map()
    added.set('en', { key1: 'hello', key2: 'world' })
    added.set('fr', { key1: 'Bonjour', key2: 'à tous' })
    addTranslations(added, translations)
    expect(get(translate)('key1')).toBe('hello')
    locale.set('fr')
    expect(get(translate)('key1')).toBe('Bonjour')
  })

  it('configure a several bundles with default', () => {
    const added = new Map()
    added.set(defaultKey, { key1: 'hello', key2: 'world' })
    added.set('fr', { key2: 'à tous' })
    addTranslations(added, translations)
    expect(get(translate)('key1')).toBe('hello')
    locale.set('fr')
    expect(get(translate)('key1')).toBe('hello')
    expect(get(translate)('key2')).toBe('à tous')
  })
})
