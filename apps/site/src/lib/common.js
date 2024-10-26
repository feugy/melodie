import '@melodie/ui/src/style.css'
import '../style.css'

import { addTranslations, defaultKey } from '@melodie/ui/src/utils/translations'
import { translations } from 'svelte-intl'

import en from '../locale/en.yml'
import fr from '../locale/fr.yml'

const bundles = new Map()
bundles.set(defaultKey, en)
bundles.set('en', en)
bundles.set('fr', fr)

addTranslations(bundles, translations)
