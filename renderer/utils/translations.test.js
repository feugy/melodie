'use strict'

const { get } = require('svelte/store')
const { translations, translate, locale } = require('svelte-intl')
const { addTranslations, defaultKey } = require('./translations')

describe('translations utilities', () => {
  beforeEach(() => {
    translations.set({})
  })

  it('configure a simple bundle', () => {
    const added = new Map()
    added.set('en', { key1: 'hello', key2: 'world' })
    addTranslations(added)
    expect(get(translate)('key1')).toEqual('hello')
  })

  it('configure a several bundles', () => {
    const added = new Map()
    added.set('en', { key1: 'hello', key2: 'world' })
    added.set('fr', { key1: 'Bonjour', key2: 'à tous' })
    addTranslations(added)
    expect(get(translate)('key1')).toEqual('hello')
    locale.set('fr')
    expect(get(translate)('key1')).toEqual('Bonjour')
  })

  it('configure a several bundles with default', () => {
    const added = new Map()
    added.set(defaultKey, { key1: 'hello', key2: 'world' })
    added.set('fr', { key2: 'à tous' })
    addTranslations(added)
    expect(get(translate)('key1')).toEqual('hello')
    locale.set('fr')
    expect(get(translate)('key1')).toEqual('hello')
    expect(get(translate)('key2')).toEqual('à tous')
  })
})
