'use strict'

import { locale } from 'svelte-intl'
import '../../renderer/tailwind.svelte'
import '../../renderer/style.svelte'
// order is important: app must be imported after tailwind and style definitions
import * as sapper from '@sapper/app'

import en from '../locale/en.yml'
import fr from '../locale/fr.yml'
import { addTranslations, defaultKey } from '../../renderer/utils/translations'

const bundles = new Map()
bundles.set(defaultKey, en)
bundles.set('en', en)
bundles.set('fr', fr)

addTranslations(bundles)
locale.set(navigator.language.slice(0, 2))

sapper.start({
  target: document.querySelector('#sapper')
})
