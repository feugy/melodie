'use strict'

import { translations } from 'svelte-intl'
import '../../../../node_modules/tailwindcss/tailwind.css'
import { addTranslations, defaultKey } from '@melodie/ui/src/utils/translations'
import '../style.svelte'
import en from '../../locale/en.yml'
import fr from '../../locale/fr.yml'

const bundles = new Map()
bundles.set(defaultKey, en)
bundles.set('en', en)
bundles.set('fr', fr)

addTranslations(bundles, translations)
