'use strict'

import { locale, getBrowserLocale, translations } from 'svelte-intl'
import { defaultKey, addTranslations } from '@melodie/ui/src/utils/translations'
import styles from './styles.svelte'
// order is important: app must be imported after tailwind and style definitions
import * as sapper from '@sapper/app'

import en from '../locale/en.yml'
import fr from '../locale/fr.yml'

const bundles = new Map()
bundles.set(defaultKey, en)
bundles.set('en', en)
bundles.set('fr', fr)

// latest rollup-plugin-svelte requires import to be used
console.log({ styles })

addTranslations(bundles, translations)
locale.set(getBrowserLocale('en'))

sapper.start({
  target: document.querySelector('#sapper')
})
