import { file, plugin } from 'bun'
import { compile, compileModule } from 'svelte/compiler'
import removeTS from 'ts-blank-space'

plugin({
	name: 'svelte',

	async setup(build) {
		build.onLoad({ filter: /\.svelte\.[j|t]s$/ }, async ({ path }) => {
			const source = await file(path).text()
			const isTS = path.endsWith('.ts')
			return {
				contents: compileModule(isTS ? removeTS(source) : source, {
					filename: path,
					generate: 'client'
				}).js.code,
				loader: 'js'
			}
		})

		build.onLoad({ filter: /\.svelte$/ }, async ({ path }) => {
			const source = await file(path).text()
			return {
				contents: compile(source, {
					filename: path,
					generate: 'client',
					dev: true,
					// runes: true,
					modernAst: true
				}).js.code,
				loader: 'js'
			}
		})
	}
})
