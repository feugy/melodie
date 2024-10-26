import { enhancedImages } from '@sveltejs/enhanced-img'
import { sveltekit } from '@sveltejs/kit/vite'
import { svelteTesting } from '@testing-library/svelte/vite'
// import { SvelteKitPWA as pwa } from '@vite-pwa/sveltekit'
import precompileIntl from 'svelte-intl-precompile/sveltekit-plugin'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	server: { host: true },
	plugins: [
		enhancedImages(),
		sveltekit(),
		svelteTesting(),
		precompileIntl('./locales')
		/*pwa({
			mode: 'development',
			pwaAssets: {
				preset: 'minimal-2023',
				image: 'static/icon.svg',
				injectThemeColor: false
			},
			manifest: {
				name: 'Mélodie',
				short_name: 'Mélodie',
				start_url: '/',
				scope: '/',
				display: 'standalone',
				theme_color: '#ffffff',
				background_color: '#ffffff'
			},
			devOptions: { enabled: true, type: 'module', navigateFallback: '/' },
			kit: { includeVersionFile: true }
		})*/
	],
	resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
	test: {
		setupFiles: ['src/lib/tests/setup.ts'],
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
})
