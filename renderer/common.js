'use strict'

import { locale, translations } from 'svelte-intl'
import en from '../locale/en.yml'
import fr from '../locale/fr.yml'
import './style.css'

// TODO deep default
translations.update({ en, fr: { ...en, ...fr } })
locale.set('fr')
