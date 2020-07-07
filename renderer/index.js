'use strict'

import { locale, translations } from 'svelte-intl'
import { enableMapSet } from 'immer'
import App from './App.svelte'

enableMapSet()

// TODO load on demand
import en from '../locale/en.yml'
import fr from '../locale/fr.yml'

// TODO deep default
translations.update({ en, fr: { ...en, ...fr } })
locale.set('fr')

const app = new App({
  target: document.body,
  props: {}
})

export default app
