import { readdir } from 'node:fs/promises'
import { extname, join } from 'node:path'
import * as babel from '@babel/core'
import buildICUPlugin from 'babel-plugin-precompile-intl'
import { type BunPlugin, type OnLoadResult, env, file, plugin } from 'bun'
import { parse } from 'yaml'
import config from '../../../svelte.config'

const sveltekitPlugin: BunPlugin = {
	name: 'bun-sveltekit',

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

		const plugin = buildICUPlugin('svelte-intl-precompile')
		const localesFolder = 'locales'
		for (const name of await readdir(localesFolder)) {
			const lang = name.replace(extname(name), '')
			const filename = join(localesFolder, name)
			const content = parse(await file(filename).text())
			const parsed = babel.transform(
				`export default ${JSON.stringify(content)}`,
				{ filename, plugins: [plugin] }
			)
			build.module(`$locales/${lang}`, () => ({
				contents: parsed?.code as string,
				loader: 'js'
			}))
		}

		build.module('$app/environment', () => ({
			exports: {
				browser: false,
				building: false,
				dev: false,
				version: 'bun:test'
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
}

export default sveltekitPlugin

plugin(sveltekitPlugin)
