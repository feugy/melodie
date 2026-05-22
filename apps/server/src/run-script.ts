import { parseArgs } from 'node:util'
import { addUser } from './scripts/add-user.ts'
import { help } from './scripts/help.ts'
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
			password: { type: 'string', short: 'p' },
			help: { type: 'boolean', short: 'h' }
		},
		script: addUser
	},
	'refresh-certs': {
		options: {
			config: { type: 'string', short: 'c', default: '.melodie' },
			port: { type: 'string', short: 'p', default: '80' },
			email: { type: 'string', short: 'e' },
			help: { type: 'boolean', short: 'h' }
		},
		script: refreshCerts
	},
	help: {
		options: {
			help: { type: 'boolean', short: 'h' }
		},
		script: help
	}
}

const scriptNames = Object.keys(scripts)

export async function runScript(args: string[]) {
	const command = args.find(a => !a.startsWith('-') && scriptNames.includes(a))

	if ((args.includes('--help') || args.includes('-h')) && !command) {
		await help({}, ['help'])
		return true
	}

	if (command) {
		const { script, options } = scripts[command]
		const { values, positionals } = parseArgs({ args, options, allowPositionals: true })
		if (values.help) {
			await script(values, positionals)
			return true
		}
		for (const [name, spec] of Object.entries(options)) {
			if (spec.type === 'boolean') continue
			if (!(name in values)) {
				console.log(`${command} requires option --${name}/-${spec.short}`)
				return true
			}
		}
		await script(values, positionals)
		return true
	}
	return false
}
