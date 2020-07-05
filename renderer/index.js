import { locale, translations } from 'svelte-intl'
import App from './App.svelte'

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
