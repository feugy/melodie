import { translations } from 'svelte-intl'
import { defaultKey, addTranslations } from '@melodie/ui/src/utils/translations'
import './styles.css'

import en from './locale/en.yml'
import fr from './locale/fr.yml'

const bundles = new Map()
bundles.set(defaultKey, en)
bundles.set('en', en)
bundles.set('fr', fr)

addTranslations(bundles, translations)
