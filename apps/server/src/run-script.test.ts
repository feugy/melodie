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

const addUserMock = mock(() => undefined)
const refreshCertsMock = mock(() => undefined)

mock.module('./scripts/add-user.ts', () => ({ addUser: addUserMock }))
mock.module('./scripts/refresh-certs.ts', () => ({
	refreshCerts: refreshCertsMock
}))

let runScript: typeof import('./run-script.ts')['runScript']

describe('runScript', () => {
	beforeAll(async () => {
		;({ runScript } = await import('./run-script.ts'))
	})

	beforeEach(() => {
		spyOn(console, 'log').mockImplementation(() => {})
	})

	afterEach(() => {
		mock.restore()
		addUserMock.mockClear()
		refreshCertsMock.mockClear()
	})

	it('returns false when no script name is in args', async () => {
		expect(await runScript(['-c', '/tmp/config'])).toBe(false)
	})

	it('returns false for empty args', async () => {
		expect(await runScript([])).toBe(false)
	})

	it('logs missing option and returns true when add-user args are incomplete', async () => {
		const result = await runScript(['add-user'])

		expect(result).toBe(true)
		expect(console.log).toHaveBeenCalledWith(
			'add-user requires option --name/-n'
		)
		expect(addUserMock).not.toHaveBeenCalled()
	})

	it('calls addUser with parsed values', async () => {
		const result = await runScript(['add-user', '-n', 'admin', '-p', 'secret'])

		expect(result).toBe(true)
		expect(addUserMock).toHaveBeenCalledWith(
			{
				config: '.melodie',
				name: 'admin',
				password: 'secret'
			},
			['add-user']
		)
	})

	it('logs missing option and returns true when refresh-certs args are incomplete', async () => {
		const result = await runScript(['refresh-certs'])

		expect(result).toBe(true)
		expect(console.log).toHaveBeenCalledWith(
			'refresh-certs requires option --email/-e'
		)
		expect(refreshCertsMock).not.toHaveBeenCalled()
	})

	it('calls refreshCerts with parsed values', async () => {
		const result = await runScript(['refresh-certs', '-e', 'admin@test.com'])

		expect(result).toBe(true)
		expect(refreshCertsMock).toHaveBeenCalledWith(
			{
				config: '.melodie',
				port: '80',
				email: 'admin@test.com'
			},
			['refresh-certs']
		)
	})

	it('calls refreshCerts with a domain option', async () => {
		const result = await runScript([
			'refresh-certs',
			'-e',
			'admin@test.com',
			'-d',
			'melodie.hd.free.fr'
		])

		expect(result).toBe(true)
		expect(refreshCertsMock).toHaveBeenCalledWith(
			{
				config: '.melodie',
				port: '80',
				email: 'admin@test.com',
				domain: 'melodie.hd.free.fr'
			},
			['refresh-certs']
		)
	})

	it('shows general help with --help flag', async () => {
		const result = await runScript(['--help'])

		expect(result).toBe(true)
		expect(console.log).toHaveBeenCalledWith(
			expect.stringMatching(/^Usage: melodie \[options\] \[command\]/)
		)
	})

	it('shows general help with help command', async () => {
		const result = await runScript(['--help'])

		expect(result).toBe(true)
		expect(console.log).toHaveBeenCalledWith(
			expect.stringMatching(/^Usage: melodie \[options\] \[command\]/)
		)
	})

	it('shows add-user help with -h flag', async () => {
		const result = await runScript(['add-user', '--help'])

		expect(result).toBe(true)
		expect(addUserMock).toHaveBeenCalledWith(
			{ help: true, config: '.melodie' },
			['add-user']
		)
	})

	it('shows add-user help with help command', async () => {
		const result = await runScript(['help', 'add-user'])

		expect(result).toBe(true)
		expect(addUserMock).toHaveBeenCalledWith(
			{ help: true, config: '.melodie' },
			['add-user']
		)
	})

	it('shows refresh-certs help with --help flag', async () => {
		const result = await runScript(['refresh-certs', '-h'])

		expect(result).toBe(true)
		expect(refreshCertsMock).toHaveBeenCalledWith(
			{ help: true, config: '.melodie', port: '80' },
			['refresh-certs']
		)
	})
})
