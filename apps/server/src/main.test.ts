import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	mock,
	spyOn
} from 'bun:test'
import { configurationService } from './services/configuration.ts'

const scriptNames = ['add-user', 'help', 'refresh-certs']

const runScriptMock = mock((args: string[]) => {
	const found = scriptNames.some(name => args.includes(name))
	return found
})
const assetsMock = { start: mock(() => 'http://127.0.0.1:8080'), stop: mock() }

mock.module('./run-script.ts', () => ({ runScript: runScriptMock }))
mock.module('./services/assets.ts', () => ({ assetsService: assetsMock }))

const conf = {
	host: '0.0.0.0',
	port: 8080,
	imageFolder: '/tmp/.melodie/.images',
	folders: ['/tmp/music1', '/tmp/music2'],
	database: { filename: '/tmp/.melodie/.db.sqlite3' },
	openUI: false,
	tls: undefined
}

let main: () => Promise<void>
let processExitCode: number | null
let messageHandlers: Map<string, (event: MessageEvent) => void>
let workerInstance: {
	postMessage: ReturnType<typeof mock>
	terminate: ReturnType<typeof mock>
}
let originalArgv: string[]
let originalWorker: typeof Worker

describe('main', () => {
	beforeAll(async () => {
		;({ default: main } = await import('./main.ts'))
	})

	beforeEach(() => {
		mock.restore()
		processExitCode = null
		messageHandlers = new Map()
		originalArgv = process.argv

		// @ts-expect-error -- process.exit return type is never, we just capture the code
		spyOn(process, 'exit').mockImplementation((code?: number) => {
			processExitCode = code ?? 0
		})
		spyOn(console, 'log').mockImplementation(() => {})
		spyOn(configurationService, 'read').mockResolvedValue(conf)

		originalWorker = globalThis.Worker
		workerInstance = {
			postMessage: mock((data: unknown) => {
				const payload = data as { type: string } | null
				if (payload?.type === 'stop') {
					const handler = messageHandlers.get('message')
					handler?.({ data: { type: 'stopped' } } as MessageEvent)
				}
			}),
			terminate: mock()
		}
		globalThis.Worker = mock(
			(_url: string) =>
				({
					addEventListener: (
						type: string,
						handler: (event: MessageEvent) => void
					) => {
						messageHandlers.set(type, handler)
					},
					...workerInstance
				}) as unknown as Worker
		) as unknown as typeof Worker
	})

	afterEach(() => {
		globalThis.Worker = originalWorker
		process.removeAllListeners('SIGINT')
		process.argv = originalArgv
	})

	it('runs script when requested', async () => {
		process.argv = ['', '', 'add-user', '-n', 'admin', '-p', 'secret']
		const expectedArgv = process.argv.slice(2)
		await main()

		expect(runScriptMock).toHaveBeenCalledWith(expectedArgv)
		expect(console.log).not.toHaveBeenCalledWith(
			expect.stringContaining('Mélodie is running')
		)
		expect(processExitCode).toBe(0)
	})

	it('prints running message, responds to worker ready, and stays alive', async () => {
		const expectedArgv = process.argv.slice(2)
		await main()

		expect(runScriptMock).toHaveBeenCalledWith(expectedArgv)
		expect(console.log).toHaveBeenCalledWith(
			'\nMélodie is running. Press Ctrl+C to stop.\n'
		)

		const handler = messageHandlers.get('message')
		handler?.({ data: { type: 'ready' } } as MessageEvent)

		expect(workerInstance.postMessage).toHaveBeenCalledWith({
			type: 'start',
			base: 'http://127.0.0.1:8080'
		})
		expect(processExitCode).toBeNull()
	})

	it('does not crash on unsupported messages', async () => {
		const expectedArgv = process.argv.slice(2)
		await main()

		expect(runScriptMock).toHaveBeenCalledWith(expectedArgv)

		const handler = messageHandlers.get('message')
		handler?.({ data: { type: 'comparing' } } as MessageEvent)
		handler?.({ data: { type: 'unknown' } } as MessageEvent)

		expect(workerInstance.terminate).not.toHaveBeenCalled()
		expect(console.log).not.toHaveBeenCalledWith('\nBye!\n')
		expect(processExitCode).toBeNull()
	})

	it('terminates worker and exits upon stopped message', async () => {
		const expectedArgv = process.argv.slice(2)
		await main()

		expect(runScriptMock).toHaveBeenCalledWith(expectedArgv)

		const handler = messageHandlers.get('message')
		handler?.({ data: { type: 'stopped' } } as MessageEvent)

		expect(workerInstance.terminate).toHaveBeenCalled()
		expect(console.log).toHaveBeenCalledWith('\nBye!\n')
		expect(processExitCode).toBe(0)
	})

	it('notifies worker, stops assets, and exits cleanly on SIGINT', async () => {
		const expectedArgv = process.argv.slice(2)
		await main()

		expect(runScriptMock).toHaveBeenCalledWith(expectedArgv)

		process.emit('SIGINT')
		await Promise.resolve()

		expect(workerInstance.postMessage).toHaveBeenCalledWith({ type: 'stop' })
		expect(assetsMock.stop).toHaveBeenCalled()
		expect(workerInstance.terminate).toHaveBeenCalled()
		expect(console.log).toHaveBeenCalledWith('\nBye!\n')
		expect(processExitCode).toBe(0)
	})
})
