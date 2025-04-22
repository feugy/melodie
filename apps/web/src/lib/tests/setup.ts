import { afterEach, beforeAll, expect } from 'bun:test'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { configureLocales } from '$lib/utils'
import * as matchers from '@testing-library/jest-dom/matchers'
import { cleanup } from '@testing-library/svelte'
import { env } from 'bun'
import 'fake-indexeddb/auto'

expect.extend(matchers)

beforeAll(async () => {
	env.DB_FILENAME = join(
		await mkdtemp(join(tmpdir(), 'melodie-')),
		'db.sqlite3'
	)
	configureLocales()
})

// Optional: cleans up `render` after each test
afterEach(async () => {
	cleanup()
})
