import { configureLocales } from '$lib/utils'
import { beforeAll } from 'vitest'
import '@testing-library/jest-dom/vitest'

beforeAll(() => {
	configureLocales()
})
