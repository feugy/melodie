import type { StorybookConfig } from '@storybook/sveltekit'

const config: StorybookConfig = {
	staticDirs: ['../msw', '../static'],
	stories: ['../src/**/*.stories.svelte'],
	addons: [
		'@storybook/addon-svelte-csf',
		'@storybook/addon-links',
		'@storybook/addon-essentials',
		'@storybook/addon-interactions',
		'@storybook/addon-themes'
	],
	framework: {
		name: '@storybook/sveltekit',
		options: {}
	}
}

export default config
