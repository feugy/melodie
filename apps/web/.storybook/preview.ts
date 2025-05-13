import { withThemeByDataAttribute } from '@storybook/addon-themes'
import type { Preview, SvelteRenderer } from '@storybook/svelte'
import { initialize, mswLoader } from 'msw-storybook-addon'
import '../src/app.css'
import { configureLocales } from '../src/lib/utils'

const dark = 'dark'
const light = 'light'

initialize()

const preview: Preview = {
	parameters: {
		darkMode: { stylePreview: true },
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i
			}
		}
	},
	globalTypes: {
		locale: {
			toolbar: {
				title: 'Locale',
				icon: 'globe',
				items: [
					{ value: 'fr', right: '🇫🇷', title: 'Français' },
					{ value: 'en', right: '🇺🇸', title: 'English' }
				],
				dynamicTitle: true
			}
		}
	},
	initialGlobals: {
		locale: 'fr'
	},
	decorators: [
		// light/dark mode decorator
		withThemeByDataAttribute<SvelteRenderer>({
			themes: { light, dark },
			defaultTheme: dark,
			parentSelector: 'body',
			attributeName: 'data-mode'
		}),
		// Skeleton theme decorator
		story => {
			document.body.dataset.theme = 'melodie'
			return story()
		},
		// locale decorator
		(story, { globals }) => {
			const locale = globals.locale ?? 'fr'
			configureLocales(locale)
			return story()
		}
	],
	loaders: [mswLoader]
}

export default preview
