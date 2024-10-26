// @ts-expect-error -- locales/ isn't typed.
import en from '$locales/en'
// @ts-expect-error -- locales/ isn't typed.
import fr from '$locales/fr'
import { addMessages, init } from 'svelte-intl-precompile'

export function configureLocales(initialLocale = 'fr') {
	addMessages('fr', fr)
	addMessages('en', en)
	init({ initialLocale, fallbackLocale: 'en' })
}
