import { join } from 'node:path'
import { skeleton } from '@skeletonlabs/skeleton/plugin'
import * as themes from '@skeletonlabs/skeleton/themes'
import aspectRatio from '@tailwindcss/aspect-ratio'
import containerQueries from '@tailwindcss/container-queries'
import type { Config } from 'tailwindcss'
import contentVisibility from 'tailwindcss-content-visibility'

export default {
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		join(
			require.resolve('@skeletonlabs/skeleton-svelte'),
			'../**/*.{html,js,svelte,ts}'
		)
	],
	theme: {
		extend: {}
	},
	plugins: [
		contentVisibility,
		containerQueries,
		aspectRatio,
		skeleton({ themes: [themes.crimson, themes.seafoam] })
	]
} as Config
