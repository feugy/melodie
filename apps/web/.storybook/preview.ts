import { withThemeByDataAttribute } from '@storybook/addon-themes'
import type { Preview, SvelteRenderer } from '@storybook/svelte'
import '../src/app.css'
import { configureLocales } from '../src/lib/utils'

const crimson = 'crimson'
const seafoam = 'seafoam'

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
				// The label to show for this toolbar item
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
		withThemeByDataAttribute<SvelteRenderer>({
			themes: { crimson, seafoam },
			defaultTheme: crimson,
			parentSelector: 'body',
			attributeName: 'data-theme'
		}),
		(story, { globals }) => {
			const locale = globals.locale ?? 'fr'
			configureLocales(locale)
			return story()
		}
	]
}

export default preview
