import { parseArgs } from 'node:util'
import { addUser } from './scripts/add-user.ts'
import { refreshCerts } from './scripts/refresh-certs.ts'

type Options = NonNullable<
	NonNullable<Parameters<typeof parseArgs>[0]>['options']
>
const scripts: Record<
	string,
	// biome-ignore lint/suspicious/noExplicitAny: we can't easily type the args from options
	{ options: Options; script: (...args: any[]) => Promise<unknown> }
> = {
	'add-user': {
		options: {
			config: { type: 'string', short: 'c', default: '.melodie' },
			name: { type: 'string', short: 'n' },
			password: { type: 'string', short: 'p' }
		},
		script: addUser
	},
	'refresh-certs': {
		options: {
			config: { type: 'string', short: 'c', default: '.melodie' },
			port: { type: 'string', short: 'p', default: '80' },
			email: { type: 'string', short: 'e' }
		},
		script: refreshCerts
	}
}

const scriptNames = Object.keys(scripts)

export async function runScript(args: string[]) {
	for (const scriptName of scriptNames) {
		if (args.includes(scriptName)) {
			const { script, options } = scripts[scriptName]
			const { values } = parseArgs({ options, allowPositionals: true })
			for (const [name, spec] of Object.entries(options)) {
				if (!(name in values)) {
					console.log(`${scriptName} requires option --${name}/-${spec.short}`)
					return true
				}
			}
			await script(values)
			return true
		}
	}
	return false
}
