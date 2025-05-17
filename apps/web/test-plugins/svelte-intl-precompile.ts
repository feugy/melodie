import { readdir } from 'node:fs/promises'
import { extname, join } from 'node:path'
import * as babel from '@babel/core'
import buildICUPlugin from 'babel-plugin-precompile-intl'
import { file, plugin } from 'bun'
import { parse } from 'yaml'

plugin({
	name: 'svelte-intl-precompile',

	async setup(build) {
		const plugin = buildICUPlugin('svelte-intl-precompile')
		const localesFolder = 'locales'

		for (const name of await readdir(localesFolder)) {
			const lang = name.replace(extname(name), '')
			const filename = join(localesFolder, name)

			const content = parse(await file(filename).text())

			build.module(`$locales/${lang}`, () => ({
				contents: babel.transform(`export default ${JSON.stringify(content)}`, {
					filename,
					plugins: [plugin]
				})?.code as string,
				loader: 'js'
			}))
		}
	}
})
