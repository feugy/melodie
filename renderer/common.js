'use strict'

import en from '../locale/en.yml'
import fr from '../locale/fr.yml'
import './style.svelte'
import { addTranslations, defaultKey } from './utils/translations'

const bundles = new Map()
bundles.set(defaultKey, en)
bundles.set('en', en)
bundles.set('fr', fr)

addTranslations(bundles)
