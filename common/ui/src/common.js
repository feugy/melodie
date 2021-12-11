'use strict'

import { translations } from 'svelte-intl'
import en from '../locale/en.yml'
import fr from '../locale/fr.yml'
import 'virtual:windi.css'
import './style.postcss'
import { addTranslations, defaultKey } from './utils/translations'

const bundles = new Map()
bundles.set(defaultKey, en)
bundles.set('en', en)
bundles.set('fr', fr)

addTranslations(bundles, translations)
