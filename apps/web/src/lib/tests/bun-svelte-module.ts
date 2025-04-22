import { file, plugin } from 'bun'
import { compileModule } from 'svelte/compiler'
import removeTS from 'ts-blank-space'

plugin({
	name: 'bun-svelte-module',

	async setup(build) {
		build.onLoad({ filter: /\.svelte\.[j|t]s$/ }, async ({ path }) => {
			const text = await file(path).text()
			const isTS = path.endsWith('.ts')
			return {
				contents: compileModule(isTS ? removeTS(text) : text, {
					filename: path,
					generate: 'client'
				}).js.code,
				loader: 'js'
			}
		})
	}
})
