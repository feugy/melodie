'use strict'

import { translations } from 'svelte-intl'
import en from '../locale/en.yml'
import fr from '../locale/fr.yml'
import './style.pcss'

// use en as default locale, and fallback for missing keys
translations.update({ en, fr: { ...en, ...fr } })
