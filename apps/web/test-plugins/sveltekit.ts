import { type OnLoadResult, env, plugin } from 'bun'
import config from '../svelte.config'
plugin({
	name: 'sveltekit',

	async setup(build) {
		const envModule: () => OnLoadResult = () => {
			const exports = { env: {} }
			Object.defineProperty(exports, 'env', { get: () => env })
			return { exports, loader: 'object' }
		}
		build.module('$env/dynamic/private', envModule)
		build.module('$env/dynamic/public', envModule)
		build.module('$env/static/private', envModule)
		build.module('$env/static/public', envModule)

		build.module('$app/environment', () => ({
			exports: {
				browser: false,
				building: false,
				dev: false,
				version: 'bun:test'
			},
			loader: 'object'
		}))

		build.module('$app/navigation', () => ({
			exports: {
				goto: () => void 0,
				afterNavigate: () => void 0
			},
			loader: 'object'
		}))

		build.module('$app/state', () => ({
			exports: {
				page: {
					url: new URL('http://localhost')
				}
			},
			loader: 'object'
		}))

		build.module('$app/paths', () => ({
			exports: {
				base: config.kit?.paths?.base ?? '',
				assets: config.kit?.paths?.assets ?? '',
				resolveRoute(route: string, params: Record<string, string>) {
					const result: string[] = []
					for (const part of route.split('/')) {
						const match = part.match(/^\[(.+)\]$/)
						if (match) {
							result.push(params[match[1]] ?? '')
						} else {
							result.push
						}
					}
					return result.join('/')
				}
			},
			loader: 'object'
		}))
	}
})
