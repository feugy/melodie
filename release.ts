import { cp, mkdir, rename, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { parseArgs } from 'node:util'
import { file, spawn, write } from 'bun'

async function runBun(target: string, script: string, ...args: string[]) {
	return run(['bun', 'run', '-F', target, script, ...args])
}

async function run(command: string[]) {
	const proc = spawn(command, { stdout: 'inherit' })
	if (0 !== (await proc.exited)) {
		throw new Error(`Failed to run '${command.join(' ')}'`)
	}
}

async function fixWebHandler(path: string) {
	const replacements = [
		{
			from: 'const dir = path.dirname(fileURLToPath(import.meta.url));',
			to: 'const dir = process.cwd();'
		}
	]

	const handlerFile = file(path)
	if (!(await handlerFile.exists())) {
		throw new Error(`${path} does not exist. Stopping`)
	}
	let content = await handlerFile.text()
	for (const { from, to } of replacements) {
		if (!content.includes(from)) {
			throw new Error(`Could not find ${from} in ${path}`)
		}
		content = content.replace(from, to)
	}
	await write(handlerFile, content)
}

async function copyWebFiles(from: string, to: string) {
	await rm(to, { recursive: true, force: true })
	await cp(from, to, { recursive: true, force: true })
}

async function downloadSharp({ cpu, os }: { cpu: string; os: string }) {
	const name = `sharp-libvips-${os}-${cpu}`
	const { version } = await (
		await fetch(`https://registry.npmjs.org/@img/${name}/latest`)
	).json()
	const folder = 'build'
	const finalFolder = join(folder, `node_modules/@img/${name}`)
	const archiveName = join(folder, `${name}.tgz`)
	await run([
		'wget',
		'--quiet',
		`--output-document=${archiveName}`,
		`https://registry.npmjs.org/@img/${name}/-/${name}-${version}.tgz`
	])
	await run(['tar', '-xf', archiveName, '-C', folder])
	await Bun.file(archiveName).delete()
	await rm(dirname(finalFolder), { force: true, recursive: true })
	await mkdir(dirname(finalFolder), { recursive: true })
	// by convention, npm packages are in a 'package' folder
	await rename(join(folder, 'package'), finalFolder)
}

async function main() {
	const {
		values: { cpu, os }
	} = parseArgs({
		args: Bun.argv,
		options: {
			cpu: {
				type: 'string',
				default: 'arm64'
			},
			os: {
				type: 'string',
				default: 'linux'
			}
		},
		strict: true,
		allowPositionals: true
	})
	// by convention, @sveltekit/adapter-node output is in apps/web/build
	// https://svelte.dev/docs/kit/adapter-node#Options
	await runBun('web', 'build')
	await fixWebHandler('apps/web/build/handler.js')
	await copyWebFiles('apps/web/build/client', 'build/client')
	await downloadSharp({ cpu, os })
	await runBun('server', 'build', `--target=bun-${os}-${cpu}`)
}

main()
