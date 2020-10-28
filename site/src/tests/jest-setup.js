'use strict'

import en from '../../locale/en.yml'
import fr from '../../locale/fr.yml'
import {
  addTranslations,
  defaultKey
} from '../../../renderer/utils/translations'
import { version } from '../../../package.json'

const bundles = new Map()
bundles.set(defaultKey, en)
bundles.set('en', en)
bundles.set('fr', fr)

addTranslations(bundles)

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

global.MELODIE_VERSION = version
