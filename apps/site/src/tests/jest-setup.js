'use strict'

import { translations } from 'svelte-intl'
import { addTranslations, defaultKey } from '@melodie/ui/src/utils/translations'
import en from '../../locale/en.yml'
import fr from '../../locale/fr.yml'

const bundles = new Map()
bundles.set(defaultKey, en)
bundles.set('en', en)
bundles.set('fr', fr)

addTranslations(bundles, translations)

window.IntersectionObserver = function () {
  return {
    observe: jest.fn(),
    unobserve: jest.fn()
  }
}

window.ResizeObserver = function () {
  return {
    observe: jest.fn(),
    unobserve: jest.fn()
  }
}

Element.prototype.scrollTo = jest.fn()
