'use strict'

import '@storybook/addon-console'
import '../../node_modules/tailwindcss/tailwind.css'
import '../../renderer/style.svelte'
import '../../public/fonts.css'
import '../src/style.svelte'
import en from '../locale/en.yml'
import fr from '../locale/fr.yml'
import { addTranslations, defaultKey } from '../../renderer/utils/translations'

const bundles = new Map()
bundles.set(defaultKey, en)
bundles.set('en', en)
bundles.set('fr', fr)

addTranslations(bundles)
