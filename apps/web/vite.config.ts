import { enhancedImages } from '@sveltejs/enhanced-img'
import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { svelteTesting } from '@testing-library/svelte/vite'
import precompileIntl from 'svelte-intl-precompile/sveltekit-plugin'
import { defineConfig } from 'vite'

export default defineConfig({
	server: { host: true },
	plugins: [
		enhancedImages(),
		tailwindcss(),
		sveltekit(),
		svelteTesting(),
		precompileIntl('./locales')
	]
})
